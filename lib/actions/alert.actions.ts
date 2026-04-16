'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';

import { PriceAlert } from '@/database/models/alert.model';
import { Notification } from '@/database/models/notification.model';
import { connectToDatabase } from '@/database/mongoose';
import { auth } from '@/lib/better-auth/auth';
import { fetchJSON } from '@/lib/actions/finnhub.actions';
import { formatPrice } from '@/lib/utils';

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

async function getCurrentUserId() {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
        throw new Error('You must be signed in to manage alerts');
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

async function getCurrentPrice(symbol: string) {
    const token = getFinnhubToken();
    const quote = await fetchJSON<QuoteData>(`${FINNHUB_BASE_URL}/quote?symbol=${encodeURIComponent(symbol)}&token=${token}`, 60);
    return quote.c || 0;
}

export async function getAlerts(): Promise<Alert[]> {
    try {
        const userId = await getCurrentUserId();
        await connectToDatabase();

        const alerts = await PriceAlert.find({ userId }).sort({ active: -1, createdAt: -1 }).lean();

        return await Promise.all(
            alerts.map(async (alert) => {
                const symbol = String(alert.symbol).toUpperCase();
                let currentPrice = 0;

                try {
                    currentPrice = await getCurrentPrice(symbol);
                } catch (err) {
                    console.error('getAlerts price error:', symbol, err);
                }

                return {
                    id: String(alert._id),
                    symbol,
                    company: String(alert.company || symbol),
                    alertName: String(alert.alertName),
                    currentPrice,
                    alertType: alert.alertType,
                    threshold: Number(alert.threshold),
                    active: Boolean(alert.active),
                    createdAt: alert.createdAt,
                    lastTriggeredAt: alert.lastTriggeredAt,
                };
            })
        );
    } catch (err) {
        console.error('getAlerts error:', err);
        return [];
    }
}

export async function createPriceAlert(data: AlertData) {
    const userId = await getCurrentUserId();
    await connectToDatabase();

    const cleanSymbol = data.symbol.trim().toUpperCase();
    const threshold = Number(data.threshold);

    if (!cleanSymbol || !Number.isFinite(threshold) || threshold <= 0) {
        return { success: false, error: 'Enter a valid stock symbol and target price' };
    }

    try {
        await PriceAlert.create({
            userId,
            symbol: cleanSymbol,
            company: data.company.trim() || cleanSymbol,
            alertName: data.alertName.trim() || `${cleanSymbol} price alert`,
            alertType: data.alertType,
            threshold,
            active: true,
            createdAt: new Date(),
        });

        await Notification.create({
            userId,
            type: 'price-alert',
            title: `${cleanSymbol} alert created`,
            message: `We will email you when ${cleanSymbol} moves ${data.alertType === 'upper' ? 'above' : 'below'} ${formatPrice(threshold)}.`,
            symbol: cleanSymbol,
            url: `/stocks/${cleanSymbol}`,
        });

        revalidatePath('/watchlist');
        return { success: true };
    } catch (err) {
        console.error('createPriceAlert error:', err);
        return { success: false, error: 'Failed to create price alert' };
    }
}

export async function deletePriceAlert(alertId: string) {
    const userId = await getCurrentUserId();
    await connectToDatabase();

    try {
        await PriceAlert.deleteOne({ _id: alertId, userId });
        revalidatePath('/watchlist');
        return { success: true };
    } catch (err) {
        console.error('deletePriceAlert error:', err);
        return { success: false, error: 'Failed to delete price alert' };
    }
}
