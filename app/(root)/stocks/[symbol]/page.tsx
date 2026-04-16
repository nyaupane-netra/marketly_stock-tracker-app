import TradingViewWidget from "@/components/TradingViewWidget";
import WatchlistButton from "@/components/WatchlistButton";
import {
    SYMBOL_INFO_WIDGET_CONFIG,
    CANDLE_CHART_WIDGET_CONFIG,
    BASELINE_WIDGET_CONFIG,
    TECHNICAL_ANALYSIS_WIDGET_CONFIG,
    COMPANY_PROFILE_WIDGET_CONFIG,
    COMPANY_FINANCIALS_WIDGET_CONFIG,
} from "@/lib/constants";
import {isStockInWatchlist} from "@/lib/actions/watchlist.actions";
import {getStockOverview} from "@/lib/actions/finnhub.actions";
import {getChangeColorClass} from "@/lib/utils";

export default async function StockDetails({ params }: StockDetailsPageProps) {
    const { symbol } = await params;
    const stockSymbol = symbol.toUpperCase();
    const [isInWatchlist, overview] = await Promise.all([
        isStockInWatchlist(stockSymbol),
        getStockOverview(stockSymbol),
    ]);
    const scriptUrl = `https://s3.tradingview.com/external-embedding/embed-widget-`;
    const company = overview?.company || stockSymbol;

    return (
        <div className="stock-page">
            <section className="stock-hero">
                <div className="stock-hero-main">
                    {overview?.logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={overview.logo} alt="" className="stock-logo" />
                    ) : (
                        <div className="stock-logo-fallback">{stockSymbol[0]}</div>
                    )}
                    <div>
                        <p className="stock-eyebrow">{overview?.exchange || "US"} · {overview?.industry || "Market"}</p>
                        <h1 className="stock-hero-title">{stockSymbol}</h1>
                        <p className="stock-hero-company">{company}</p>
                    </div>
                </div>

                <div className="stock-hero-actions">
                    <div className="stock-price-card">
                        <span>Current price</span>
                        <strong>{overview?.priceFormatted || "N/A"}</strong>
                        <em className={getChangeColorClass(overview?.changePercent)}>{overview?.changeFormatted || "N/A"}</em>
                    </div>
                    <WatchlistButton symbol={stockSymbol} company={company} isInWatchlist={isInWatchlist} />
                </div>
            </section>

            <section className="stock-metrics-grid">
                <div className="stock-metric-card">
                    <span>Market cap</span>
                    <strong>{overview?.marketCap || "N/A"}</strong>
                </div>
                <div className="stock-metric-card">
                    <span>P/E ratio</span>
                    <strong>{overview?.peRatio || "N/A"}</strong>
                </div>
                <div className="stock-metric-card">
                    <span>Country</span>
                    <strong>{overview?.country || "N/A"}</strong>
                </div>
                <div className="stock-metric-card">
                    <span>Website</span>
                    <strong className="truncate">{overview?.website || "N/A"}</strong>
                </div>
            </section>

            <section className="stock-details-layout">
                <div className="stock-chart-column">
                    <div className="stock-widget-panel stock-symbol-panel">
                        <TradingViewWidget
                            scriptUrl={`${scriptUrl}symbol-info.js`}
                            config={SYMBOL_INFO_WIDGET_CONFIG(symbol)}
                            height={170}
                        />
                    </div>
                    <div className="stock-widget-panel">
                        <TradingViewWidget
                            scriptUrl={`${scriptUrl}advanced-chart.js`}
                            config={CANDLE_CHART_WIDGET_CONFIG(symbol)}
                            className="custom-chart"
                            height={600}
                        />
                    </div>
                    <div className="stock-widget-panel">
                        <TradingViewWidget
                            scriptUrl={`${scriptUrl}advanced-chart.js`}
                            config={BASELINE_WIDGET_CONFIG(symbol)}
                            className="custom-chart"
                            height={520}
                        />
                    </div>
                </div>

                <aside className="stock-insight-column">
                    <div className="stock-widget-panel">
                        <h2 className="stock-panel-title">Technical pulse</h2>
                        <p className="stock-panel-copy">Quick read on trend, oscillators, and moving averages.</p>
                    </div>
                    <TradingViewWidget
                        scriptUrl={`${scriptUrl}technical-analysis.js`}
                        config={TECHNICAL_ANALYSIS_WIDGET_CONFIG(symbol)}
                        height={400}
                    />

                    <div className="stock-widget-panel">
                        <TradingViewWidget
                            scriptUrl={`${scriptUrl}company-profile.js`}
                            config={COMPANY_PROFILE_WIDGET_CONFIG(symbol)}
                            height={440}
                        />
                    </div>

                    <div className="stock-widget-panel">
                        <TradingViewWidget
                            scriptUrl={`${scriptUrl}financials.js`}
                            config={COMPANY_FINANCIALS_WIDGET_CONFIG(symbol)}
                            height={464}
                        />
                    </div>
                </aside>
            </section>
        </div>
    );
}
