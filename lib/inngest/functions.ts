import { inngest } from "@/lib/inngest/client";
import { NEWS_SUMMARY_EMAIL_PROMPT } from "@/lib/inngest/prompts";
import { sendNewsSummaryEmail, sendPriceAlertEmail } from "@/lib/nodemailer";
import { getAllUsersForNewsEmail } from "@/lib/actions/user.actions";
import { getWatchlistSymbolsByEmail } from "@/lib/actions/watchlist.actions";
import { fetchJSON, getNews } from "@/lib/actions/finnhub.actions";
import { formatPrice, getFormattedTodayDate } from "@/lib/utils";
import { connectToDatabase } from "@/database/mongoose";
import { PriceAlert } from "@/database/models/alert.model";
import { Notification } from "@/database/models/notification.model";
import { ObjectId } from "mongodb";

type UsersForNewsEmailResult = Awaited<ReturnType<typeof getAllUsersForNewsEmail>>;
type UserForNewsEmail = NonNullable<UsersForNewsEmailResult>[number];
type NewsResult = Awaited<ReturnType<typeof getNews>>;
type MarketNewsArticle = NonNullable<NewsResult>[number];
const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";
type PriceAlertRecord = {
    _id: unknown;
    userId: string;
    symbol: string;
    company: string;
    alertType: "upper" | "lower";
    threshold: number;
};

function escapeHtml(value: string) {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function buildFallbackNewsSummary(articles: MarketNewsArticle[]) {
    if (!articles.length) {
        return "<p>No major market news was available for your watchlist today.</p>";
    }

    const items = articles
        .slice(0, 6)
        .map((article) => {
            const headline = escapeHtml(article.headline);
            const source = escapeHtml(article.source || "Market News");
            const summary = escapeHtml(article.summary || "Open the full article for details.");
            const url = escapeHtml(article.url);

            return `
                <li style="margin-bottom: 16px;">
                    <strong>${headline}</strong><br />
                    <span style="color: #9095A1;">${source}</span><br />
                    <span>${summary}</span><br />
                    <a href="${url}" style="color: #E8BA40;">Read more</a>
                </li>
            `;
        })
        .join("");

    return `<ul style="padding-left: 20px; margin: 0;">${items}</ul>`;
}

export const sendDailyNewsSummary = inngest.createFunction(
    {
        id: "daily-news-summary",
        // triggers: [{ event: "app/send.daily.news" }, { cron: "* * * * *" }] ,
        triggers: [{ event: "app/send.daily.news" }, { cron: "0 12 * * *" }] ,
    },
    async ({ step }) => {
        // Step #1: Get all users for news delivery
        const users = (await step.run("get-all-users", getAllUsersForNewsEmail)) as UsersForNewsEmailResult;

        if (!users || users.length === 0) {
            return { success: false, message: "No users found for news email" };
        }

        // Step #2: For each user, get watchlist symbols -> fetch news (fallback to general)
        const results = (await step.run("fetch-user-news", async () => {
            const perUser: Array<{ user: UserForNewsEmail; articles: MarketNewsArticle[] }> = [];

            for (const user of users as UserForNewsEmail[]) {
                try {
                    const symbols = await getWatchlistSymbolsByEmail(user.email);
                    let articles = await getNews(symbols);

                    // Enforce max 6 articles per user
                    articles = (articles || []).slice(0, 6);

                    // If still empty, fallback to general
                    if (!articles || articles.length === 0) {
                        articles = await getNews();
                        articles = (articles || []).slice(0, 6);
                    }

                    perUser.push({ user, articles });
                } catch (e) {
                    console.error("daily-news: error preparing user news", user.email, e);
                    perUser.push({ user, articles: [] });
                }
            }

            return perUser;
        })) as Array<{ user: UserForNewsEmail; articles: MarketNewsArticle[] }>;

        // Step #3: (placeholder) Summarize news via AI
        const userNewsSummaries: { user: UserForNewsEmail; newsContent: string | null }[] = [];

        for (const { user, articles } of results) {
            try {
                const prompt = NEWS_SUMMARY_EMAIL_PROMPT.replace(
                    "{{newsData}}",
                    JSON.stringify(articles, null, 2)
                );

                const response = await step.ai.infer(`summarize-news-${user.email}`, {
                    model: step.ai.models.gemini({ model: "gemini-2.5-flash-lite" }),
                    body: {
                        contents: [{ role: "user", parts: [{ text: prompt }] }],
                    },
                });

                const part = response.candidates?.[0]?.content?.parts?.[0];
                const newsContent = (part && "text" in part ? part.text : null) || "No market news.";

                userNewsSummaries.push({ user, newsContent });
            } catch (e) {
                console.error("Failed to summarize news for : ", user.email, e);
                userNewsSummaries.push({ user, newsContent: buildFallbackNewsSummary(articles) });
            }
        }

        // Step #4: (placeholder) Send the emails
        await step.run("send-news-emails", async () => {
            await Promise.all(
                userNewsSummaries.map(async ({ user, newsContent }) => {
                    if (!newsContent) return false;

                    return await sendNewsSummaryEmail({
                        email: user.email,
                        date: getFormattedTodayDate(),
                        newsContent,
                    });
                })
            );
        });

        return { success: true, message: "Daily news summary emails sent successfully" };
    }
);

export const checkPriceAlerts = inngest.createFunction(
    {
        id: "check-price-alerts",
        triggers: [{ event: "app/check.price.alerts" }, { cron: "*/30 * * * *" }],
    },
    async ({ step }) => {
        const alerts = await step.run("load-active-alerts", async () => {
            await connectToDatabase();
            const items = await PriceAlert.find({ active: true }).sort({ createdAt: -1 }).lean();
            return items as unknown as PriceAlertRecord[];
        });

        if (!alerts.length) {
            return { success: true, message: "No active price alerts" };
        }

        const token = process.env.FINNHUB_API_KEY ?? process.env.NEXT_PUBLIC_FINNHUB_API_KEY ?? "";
        if (!token) {
            return { success: false, message: "FINNHUB API key is not configured" };
        }

        const usersById = await step.run("load-alert-users", async () => {
            const mongoose = await connectToDatabase();
            const db = mongoose.connection.db;
            if (!db) throw new Error("MongoDB connection not connected");

            const userIds = Array.from(new Set(alerts.map((alert) => String(alert.userId))));
            const objectIds = userIds
                .filter((id) => ObjectId.isValid(id))
                .map((id) => new ObjectId(id));
            const users = await db.collection("user").find(
                { $or: [{ id: { $in: userIds } }, { _id: { $in: objectIds } }] },
                { projection: { _id: 1, id: 1, email: 1, name: 1 } }
            ).toArray();

            const map = new Map<string, { email?: string; name?: string }>();
            users.forEach((user) => {
                const id = String(user.id || user._id || "");
                if (id) map.set(id, { email: user.email, name: user.name });
            });

            return Object.fromEntries(map);
        });

        const triggered = await step.run("evaluate-alerts", async () => {
            const quoteCache = new Map<string, number>();
            const results: Array<{
                alertId: string;
                userId: string;
                email: string;
                symbol: string;
                company: string;
                alertType: "upper" | "lower";
                threshold: number;
                currentPrice: number;
            }> = [];

            for (const alert of alerts) {
                const symbol = String(alert.symbol).toUpperCase();
                let currentPrice = quoteCache.get(symbol);

                if (currentPrice === undefined) {
                    const quote = await fetchJSON<QuoteData>(`${FINNHUB_BASE_URL}/quote?symbol=${encodeURIComponent(symbol)}&token=${token}`, 60);
                    currentPrice = quote.c || 0;
                    quoteCache.set(symbol, currentPrice);
                }

                const threshold = Number(alert.threshold);
                const didTrigger = alert.alertType === "upper"
                    ? currentPrice >= threshold
                    : currentPrice <= threshold;

                if (!didTrigger) continue;

                const userId = String(alert.userId);
                const user = usersById[userId];
                if (!user?.email) continue;

                results.push({
                    alertId: String(alert._id),
                    userId,
                    email: user.email,
                    symbol,
                    company: String(alert.company || symbol),
                    alertType: alert.alertType,
                    threshold,
                    currentPrice,
                });
            }

            return results;
        });

        await step.run("send-triggered-alerts", async () => {
            await Promise.all(
                triggered.map(async (alert) => {
                    const currentPrice = formatPrice(alert.currentPrice);
                    const targetPrice = formatPrice(alert.threshold);
                    const direction = alert.alertType === "upper" ? "above" : "below";

                    await sendPriceAlertEmail({
                        email: alert.email,
                        symbol: alert.symbol,
                        company: alert.company,
                        alertType: alert.alertType,
                        currentPrice,
                        targetPrice,
                        timestamp: new Date().toLocaleString("en-US", { timeZone: "America/Chicago" }),
                    });

                    await Notification.create({
                        userId: alert.userId,
                        type: "price-alert",
                        title: `${alert.symbol} price alert triggered`,
                        message: `${alert.symbol} moved ${direction} ${targetPrice}. Current price: ${currentPrice}.`,
                        symbol: alert.symbol,
                        url: `/stocks/${alert.symbol}`,
                    });

                    await PriceAlert.updateOne(
                        { _id: alert.alertId },
                        { $set: { active: false, lastTriggeredAt: new Date() } }
                    );
                })
            );
        });

        return { success: true, message: `${triggered.length} price alerts triggered` };
    }
);
