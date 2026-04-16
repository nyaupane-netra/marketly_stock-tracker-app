import { Star } from "lucide-react";
import SearchCommand from "@/components/SearchCommand";
import { getWatchlist } from "@/lib/actions/watchlist.actions";
import { searchStocks } from "@/lib/actions/finnhub.actions";
import PriceAlertsPanel from "@/components/PriceAlertsPanel";
import { getAlerts } from "@/lib/actions/alert.actions";
import WatchlistView from "@/components/WatchlistView";

export const dynamic = "force-dynamic";

const WatchlistPage = async () => {
    const [watchlist, initialStocks, alerts] = await Promise.all([
        getWatchlist(),
        searchStocks(),
        getAlerts(),
    ]);

    if (watchlist.length === 0) {
        return (
            <section className="watchlist-empty-container">
                <div className="watchlist-empty">
                    <Star className="watchlist-star" />
                    <h1 className="empty-title">Your watchlist is empty</h1>
                    <p className="empty-description">
                        Search for a stock and add it to keep your favorites in one place.
                    </p>
                    <SearchCommand
                        renderAs="button"
                        label="Search stocks"
                        initialStocks={initialStocks}
                    />
                </div>
            </section>
        );
    }

    return (
        <section className="watchlist-container">
            <div className="watchlist">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="watchlist-title">Watchlist</h1>
                        <p className="text-gray-500">
                            {watchlist.length} saved {watchlist.length === 1 ? "stock" : "stocks"}
                        </p>
                    </div>

                    <SearchCommand
                        renderAs="button"
                        label="Add stock"
                        initialStocks={initialStocks}
                    />
                </div>

                <WatchlistView watchlist={watchlist} />
            </div>

            <aside className="watchlist-alerts">
                <PriceAlertsPanel watchlist={watchlist} alerts={alerts} />
            </aside>
        </section>
    );
};

export default WatchlistPage;
