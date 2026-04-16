'use server';

import { connectToDatabase } from '@/database/mongoose';
import { Watchlist } from '@/database/models/watchlist.model';
import { auth } from '@/lib/better-auth/auth';
import { fetchJSON } from '@/lib/actions/finnhub.actions';
import { formatChangePercent, formatMarketCapValue, formatPrice } from '@/lib/utils';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

async function getCurrentUserId() {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
        throw new Error('You must be signed in to update your watchlist');
    }

    return session.user.id;
}

function getFinnhubToken() {
    const token = process.env.FINNHUB_API_KEY ?? process.env.NEXT_PUBLIC_FINNHUB_API_KEY ?? '';

    if (!token) {
        throw new Error('FINNHUB API key is not configured');
    }

    return token;
}

export async function getWatchlistSymbolsByEmail(email: string): Promise<string[]> {
    if (!email) return [];

    try {
        const mongoose = await connectToDatabase();
        const db = mongoose.connection.db;
        if (!db) throw new Error('MongoDB connection not found');

        // Better Auth stores users in the "user" collection
        const user = await db.collection('user').findOne<{ _id?: unknown; id?: string; email?: string }>({ email });

        if (!user) return [];

        const userId = (user.id as string) || String(user._id || '');
        if (!userId) return [];

        const items = await Watchlist.find({ userId }, { symbol: 1 }).lean();
        return items.map((i) => String(i.symbol));
    } catch (err) {
        console.error('getWatchlistSymbolsByEmail error:', err);
        return [];
    }
}

export async function getWatchlistSymbols(): Promise<string[]> {
    try {
        const userId = await getCurrentUserId();
        await connectToDatabase();

        const items = await Watchlist.find({ userId }, { symbol: 1 }).sort({ addedAt: -1 }).lean();
        return items.map((item) => String(item.symbol));
    } catch (err) {
        console.error('getWatchlistSymbols error:', err);
        return [];
    }
}

export async function isStockInWatchlist(symbol: string): Promise<boolean> {
    if (!symbol) return false;

    try {
        const userId = await getCurrentUserId();
        await connectToDatabase();

        const existing = await Watchlist.exists({ userId, symbol: symbol.toUpperCase() });
        return Boolean(existing);
    } catch (err) {
        console.error('isStockInWatchlist error:', err);
        return false;
    }
}

export async function addToWatchlist(symbol: string, company: string) {
    const userId = await getCurrentUserId();
    await connectToDatabase();

    const cleanSymbol = symbol.trim().toUpperCase();
    const cleanCompany = company.trim() || cleanSymbol;

    if (!cleanSymbol) {
        return { success: false, error: 'Stock symbol is required' };
    }

    try {
        await Watchlist.updateOne(
            { userId, symbol: cleanSymbol },
            { $setOnInsert: { userId, symbol: cleanSymbol, company: cleanCompany, category: 'General', note: '', addedAt: new Date() } },
            { upsert: true }
        );

        revalidatePath('/watchlist');
        revalidatePath(`/stocks/${cleanSymbol}`);

        return { success: true, isInWatchlist: true };
    } catch (err) {
        console.error('addToWatchlist error:', err);
        return { success: false, error: 'Failed to add stock to watchlist' };
    }
}

export async function updateWatchlistDetails(symbol: string, { note, category }: WatchlistDetailsFormData) {
    const userId = await getCurrentUserId();
    await connectToDatabase();

    const cleanSymbol = symbol.trim().toUpperCase();
    const cleanCategory = category.trim() || 'General';

    if (!cleanSymbol) {
        return { success: false, error: 'Stock symbol is required' };
    }

    try {
        await Watchlist.updateOne(
            { userId, symbol: cleanSymbol },
            { $set: { note: note.trim(), category: cleanCategory } }
        );

        revalidatePath('/watchlist');
        revalidatePath(`/stocks/${cleanSymbol}`);

        return { success: true };
    } catch (err) {
        console.error('updateWatchlistDetails error:', err);
        return { success: false, error: 'Failed to update watchlist details' };
    }
}

export async function removeFromWatchlist(symbol: string) {
    const userId = await getCurrentUserId();
    await connectToDatabase();

    const cleanSymbol = symbol.trim().toUpperCase();

    if (!cleanSymbol) {
        return { success: false, error: 'Stock symbol is required' };
    }

    try {
        await Watchlist.deleteOne({ userId, symbol: cleanSymbol });

        revalidatePath('/watchlist');
        revalidatePath(`/stocks/${cleanSymbol}`);

        return { success: true, isInWatchlist: false };
    } catch (err) {
        console.error('removeFromWatchlist error:', err);
        return { success: false, error: 'Failed to remove stock from watchlist' };
    }
}

export async function toggleWatchlist(symbol: string, company: string, shouldAdd: boolean) {
    return shouldAdd ? addToWatchlist(symbol, company) : removeFromWatchlist(symbol);
}

export async function getWatchlist(): Promise<StockWithData[]> {
    try {
        const userId = await getCurrentUserId();
        const token = getFinnhubToken();
        await connectToDatabase();

        const items = await Watchlist.find({ userId }).sort({ addedAt: -1 }).lean();

        return await Promise.all(
            items.map(async (item) => {
                const symbol = String(item.symbol).toUpperCase();
                const company = String(item.company || symbol);

                try {
                    const [quote, profile, financials] = await Promise.all([
                        fetchJSON<QuoteData>(`${FINNHUB_BASE_URL}/quote?symbol=${encodeURIComponent(symbol)}&token=${token}`, 60),
                        fetchJSON<ProfileData>(`${FINNHUB_BASE_URL}/stock/profile2?symbol=${encodeURIComponent(symbol)}&token=${token}`, 3600),
                        fetchJSON<FinancialsData>(`${FINNHUB_BASE_URL}/stock/metric?symbol=${encodeURIComponent(symbol)}&metric=all&token=${token}`, 3600),
                    ]);

                    const currentPrice = quote.c;
                    const changePercent = quote.dp;
                    const marketCapUsd = profile.marketCapitalization ? profile.marketCapitalization * 1_000_000 : 0;
                    const peRatio = financials.metric?.peNormalizedAnnual;

                    return {
                        userId,
                        symbol,
                        company: profile.name || company,
                        note: String(item.note || ''),
                        category: String(item.category || 'General'),
                        addedAt: item.addedAt,
                        currentPrice,
                        changePercent,
                        priceFormatted: currentPrice ? formatPrice(currentPrice) : 'N/A',
                        changeFormatted: formatChangePercent(changePercent) || 'N/A',
                        marketCap: formatMarketCapValue(marketCapUsd),
                        peRatio: peRatio ? peRatio.toFixed(2) : 'N/A',
                    };
                } catch (err) {
                    console.error('getWatchlist quote/profile error:', symbol, err);
                    return {
                        userId,
                        symbol,
                        company,
                        note: String(item.note || ''),
                        category: String(item.category || 'General'),
                        addedAt: item.addedAt,
                        priceFormatted: 'N/A',
                        changeFormatted: 'N/A',
                        marketCap: 'N/A',
                        peRatio: 'N/A',
                    };
                }
            })
        );
    } catch (err) {
        console.error('getWatchlist error:', err);
        return [];
    }
}
