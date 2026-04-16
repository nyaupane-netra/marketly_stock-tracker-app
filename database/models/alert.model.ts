import { Schema, model, models, type Document, type Model } from 'mongoose';

export interface PriceAlertItem extends Document {
    userId: string;
    symbol: string;
    company: string;
    alertName: string;
    alertType: 'upper' | 'lower';
    threshold: number;
    active: boolean;
    createdAt: Date;
    lastTriggeredAt?: Date;
}

const PriceAlertSchema = new Schema<PriceAlertItem>(
    {
        userId: { type: String, required: true, index: true },
        symbol: { type: String, required: true, uppercase: true, trim: true, index: true },
        company: { type: String, required: true, trim: true },
        alertName: { type: String, required: true, trim: true },
        alertType: { type: String, enum: ['upper', 'lower'], required: true },
        threshold: { type: Number, required: true },
        active: { type: Boolean, default: true, index: true },
        createdAt: { type: Date, default: Date.now },
        lastTriggeredAt: { type: Date },
    },
    { timestamps: false }
);

PriceAlertSchema.index({ userId: 1, symbol: 1, active: 1 });

export const PriceAlert: Model<PriceAlertItem> =
    (models?.PriceAlert as Model<PriceAlertItem>) || model<PriceAlertItem>('PriceAlert', PriceAlertSchema);
