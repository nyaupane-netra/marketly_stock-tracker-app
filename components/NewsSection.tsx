import { ExternalLink } from "lucide-react";
import { formatTimeAgo } from "@/lib/utils";

const NewsSection = ({ news = [], symbols = [] }: WatchlistNewsProps & { symbols?: string[] }) => {
    const hasWatchlistNews = symbols.length > 0 && news.some((article) => symbols.includes(article.related));
    const eyebrow = hasWatchlistNews ? "Watchlist news" : "General market news";
    const description = hasWatchlistNews
        ? `Latest stories connected to ${symbols.join(", ")}.`
        : "Your watchlist does not have fresh company news yet, so here are the latest general market stories.";

    return (
        <section className="news-section">
            <div className="news-section-header">
                <div>
                    <p className="news-eyebrow">{eyebrow}</p>
                    <h2 className="news-section-title">News Section</h2>
                    <p className="news-section-description">{description}</p>
                </div>
            </div>

            {news.length === 0 ? (
                <div className="news-empty">
                    No market news is available right now. Check back in a little bit.
                </div>
            ) : (
                <div className="watchlist-news">
                    {news.map((article) => (
                        <a
                            key={`${article.id}-${article.url}`}
                            href={article.url}
                            target="_blank"
                            rel="noreferrer"
                            className="news-item"
                        >
                            {article.image && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={article.image} alt="" className="news-image" />
                            )}
                            <div className="news-item-body">
                                <div className="news-meta-row">
                                    <span className="news-tag">{article.related || article.category || "Market"}</span>
                                    <span className="news-time">{formatTimeAgo(article.datetime)}</span>
                                </div>
                                <h3 className="news-title">{article.headline}</h3>
                                <p className="news-summary">{article.summary}</p>
                                <span className="news-cta">
                                    Read full story <ExternalLink className="h-3.5 w-3.5" />
                                </span>
                            </div>
                        </a>
                    ))}
                </div>
            )}
        </section>
    );
};

export default NewsSection;
