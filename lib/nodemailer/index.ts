import nodemailer from 'nodemailer';
import {
    WELCOME_EMAIL_TEMPLATE,
    NEWS_SUMMARY_EMAIL_TEMPLATE,
    STOCK_ALERT_UPPER_EMAIL_TEMPLATE,
    STOCK_ALERT_LOWER_EMAIL_TEMPLATE,
} from "@/lib/nodemailer/templates";

export const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.NODEMAILER_EMAIL!,
        pass: process.env.NODEMAILER_PASSWORD!,
    }
})

const fromAddress = process.env.NODEMAILER_EMAIL || 'netrap.nyaupane@gmail.com';

export const sendWelcomeEmail = async ({ email, name, intro }: WelcomeEmailData) => {
    const htmlTemplate = WELCOME_EMAIL_TEMPLATE
        .replace('{{name}}', name)
        .replace('{{intro}}', intro);

    const mailOptions = {
        from: `"Marketly" <${fromAddress}>`,
        to: email,
        subject: `Welcome to Marketly - your stock market toolkit is ready!`,
        text: 'Thanks for joining Marketly',
        html: htmlTemplate,
    }

    await transporter.sendMail(mailOptions);
}

export const sendNewsSummaryEmail = async (
    { email, date, newsContent }: { email: string; date: string; newsContent: string }
): Promise<void> => {
    const htmlTemplate = NEWS_SUMMARY_EMAIL_TEMPLATE
        .replace('{{date}}', date)
        .replace('{{newsContent}}', newsContent);

    const mailOptions = {
        from: `"Marketly News" <${fromAddress}>`,
        to: email,
        subject: `📈 Market News Summary Today - ${date}`,
        text: `Today's market news summary from Marketly`,
        html: htmlTemplate,
    };

    await transporter.sendMail(mailOptions);
};

export const sendPriceAlertEmail = async ({
    email,
    symbol,
    company,
    alertType,
    currentPrice,
    targetPrice,
    timestamp,
}: {
    email: string;
    symbol: string;
    company: string;
    alertType: 'upper' | 'lower';
    currentPrice: string;
    targetPrice: string;
    timestamp: string;
}): Promise<void> => {
    const template = alertType === 'upper' ? STOCK_ALERT_UPPER_EMAIL_TEMPLATE : STOCK_ALERT_LOWER_EMAIL_TEMPLATE;
    const htmlTemplate = template
        .replaceAll('{{symbol}}', symbol)
        .replaceAll('{{company}}', company)
        .replaceAll('{{currentPrice}}', currentPrice)
        .replaceAll('{{targetPrice}}', targetPrice)
        .replaceAll('{{timestamp}}', timestamp);

    const mailOptions = {
        from: `"Marketly Alerts" <${fromAddress}>`,
        to: email,
        subject: `Marketly price alert: ${symbol} ${alertType === 'upper' ? 'moved above' : 'dropped below'} ${targetPrice}`,
        text: `${symbol} triggered your price alert at ${currentPrice}.`,
        html: htmlTemplate,
    };

    await transporter.sendMail(mailOptions);
};
