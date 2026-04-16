import nodemailer from 'nodemailer';
import {
    WELCOME_EMAIL_TEMPLATE,
    NEWS_SUMMARY_EMAIL_TEMPLATE,
    STOCK_ALERT_UPPER_EMAIL_TEMPLATE,
    STOCK_ALERT_LOWER_EMAIL_TEMPLATE,
} from "@/lib/nodemailer/templates";

export const transporter = nodemailer.createTransport({
    service: 'gmail',
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
    auth: {
        user: process.env.NODEMAILER_EMAIL!,
        pass: process.env.NODEMAILER_PASSWORD!,
    }
})

const fromAddress = process.env.NODEMAILER_EMAIL || 'netrap.nyaupane@gmail.com';
const configuredBaseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.BETTER_AUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
    'https://marketly-stock-tracker-app.vercel.app';
const appBaseUrl = configuredBaseUrl.replace(/\/+$/, '');
const dashboardUrl = `${appBaseUrl}/`;
const newsUrl = `${appBaseUrl}/news`;
const watchlistUrl = `${appBaseUrl}/watchlist`;
const unsubscribeUrl = `mailto:${fromAddress}?subject=Unsubscribe%20from%20Marketly%20emails`;
export const WELCOME_EMAIL_FALLBACK_INTRO =
    "Thanks for joining Marketly. Your account is ready, and you can now track your watchlist, follow market news, and set alerts for the stocks you care about.";

function escapeHtml(value: string) {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

const applyEmailLinks = (template: string, stockSymbol?: string) => template
    .replaceAll('{{dashboardUrl}}', dashboardUrl)
    .replaceAll('{{newsUrl}}', newsUrl)
    .replaceAll('{{watchlistUrl}}', watchlistUrl)
    .replaceAll('{{stockUrl}}', stockSymbol ? `${appBaseUrl}/stocks/${encodeURIComponent(stockSymbol)}` : dashboardUrl)
    .replaceAll('{{unsubscribeUrl}}', unsubscribeUrl);

const buildWelcomeIntroHtml = (intro: string) => {
    const readableIntro = intro
        .replaceAll('#CCDADC', '#4b5563')
        .replaceAll('#ccdadc', '#4b5563');

    if (/<[a-z][\s\S]*>/i.test(readableIntro)) {
        return readableIntro;
    }

    return `<p class="mobile-text" style="margin: 0 0 26px 0; font-size: 16px; line-height: 1.6; color: #4b5563;">${escapeHtml(readableIntro)}</p>`;
};

export const sendWelcomeEmail = async ({ email, name, intro }: WelcomeEmailData) => {
    const htmlTemplate = applyEmailLinks(WELCOME_EMAIL_TEMPLATE)
        .replace('{{name}}', name)
        .replace('{{intro}}', buildWelcomeIntroHtml(intro));

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
    const htmlTemplate = applyEmailLinks(NEWS_SUMMARY_EMAIL_TEMPLATE)
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
    const htmlTemplate = applyEmailLinks(template, symbol)
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
