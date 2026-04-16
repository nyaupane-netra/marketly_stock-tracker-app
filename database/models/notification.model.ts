import { Schema, model, models, type Document, type Model } from 'mongoose';

export interface NotificationItem extends Document {
    userId: string;
    type: 'price-alert' | 'watchlist' | 'system';
    title: string;
    message: string;
    symbol?: string;
    url?: string;
    isRead: boolean;
    createdAt: Date;
}

const NotificationSchema = new Schema<NotificationItem>(
    {
        userId: { type: String, required: true, index: true },
        type: { type: String, enum: ['price-alert', 'watchlist', 'system'], default: 'system' },
        title: { type: String, required: true, trim: true },
        message: { type: String, required: true, trim: true },
        symbol: { type: String, uppercase: true, trim: true },
        url: { type: String, trim: true },
        isRead: { type: Boolean, default: false, index: true },
        createdAt: { type: Date, default: Date.now },
    },
    { timestamps: false }
);

NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export const Notification: Model<NotificationItem> =
    (models?.Notification as Model<NotificationItem>) || model<NotificationItem>('Notification', NotificationSchema);
