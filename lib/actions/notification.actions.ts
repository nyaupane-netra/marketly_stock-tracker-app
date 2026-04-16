'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';

import { connectToDatabase } from '@/database/mongoose';
import { Notification } from '@/database/models/notification.model';
import { auth } from '@/lib/better-auth/auth';

async function getCurrentUserId() {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
        throw new Error('You must be signed in to view notifications');
    }

    return session.user.id;
}

export async function getNotifications(limit = 8): Promise<AppNotification[]> {
    try {
        const userId = await getCurrentUserId();
        await connectToDatabase();

        const items = await Notification.find({ userId }).sort({ createdAt: -1 }).limit(limit).lean();

        return items.map((item) => ({
            id: String(item._id),
            type: item.type,
            title: item.title,
            message: item.message,
            symbol: item.symbol,
            url: item.url,
            isRead: item.isRead,
            createdAt: item.createdAt,
        }));
    } catch (err) {
        console.error('getNotifications error:', err);
        return [];
    }
}

export async function getUnreadNotificationCount(): Promise<number> {
    try {
        const userId = await getCurrentUserId();
        await connectToDatabase();

        return await Notification.countDocuments({ userId, isRead: false });
    } catch (err) {
        console.error('getUnreadNotificationCount error:', err);
        return 0;
    }
}

export async function markNotificationsRead() {
    try {
        const userId = await getCurrentUserId();
        await connectToDatabase();

        await Notification.updateMany({ userId, isRead: false }, { $set: { isRead: true } });
        revalidatePath('/');
        revalidatePath('/watchlist');

        return { success: true };
    } catch (err) {
        console.error('markNotificationsRead error:', err);
        return { success: false, error: 'Failed to update notifications' };
    }
}
