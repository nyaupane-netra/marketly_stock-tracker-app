import NewsSection from "@/components/NewsSection";
import { getNews } from "@/lib/actions/finnhub.actions";
import { getWatchlistSymbols } from "@/lib/actions/watchlist.actions";

export const dynamic = "force-dynamic";

const NewsPage = async () => {
    const watchlistSymbols = await getWatchlistSymbols();
    let news: MarketNewsArticle[] = [];

    try {
        news = await getNews(watchlistSymbols);
    } catch (error) {
        console.error("Failed to load news page", error);
    }

    return <NewsSection news={news} symbols={watchlistSymbols} />;
};

export default NewsPage;
