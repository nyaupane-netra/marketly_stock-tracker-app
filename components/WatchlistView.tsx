"use client";

import Link from "next/link";
import React, { useMemo, useState } from "react";
import { ArrowDownAZ, Search } from "lucide-react";

import WatchlistButton from "@/components/WatchlistButton";
import WatchlistDetailsForm from "@/components/WatchlistDetailsForm";
import { getChangeColorClass } from "@/lib/utils";

const WatchlistView = ({ watchlist }: { watchlist: StockWithData[] }) => {
    const [category, setCategory] = useState("All");
    const [query, setQuery] = useState("");
    const [sortBy, setSortBy] = useState<"recent" | "symbol" | "change">("recent");

    const categories = useMemo(
        () => ["All", ...Array.from(new Set(watchlist.map((stock) => stock.category || "General")))],
        [watchlist]
    );

    const filteredWatchlist = useMemo(() => {
        const cleanQuery = query.trim().toLowerCase();

        return watchlist
            .filter((stock) => category === "All" || (stock.category || "General") === category)
            .filter((stock) => {
                if (!cleanQuery) return true;
                return (
                    stock.symbol.toLowerCase().includes(cleanQuery) ||
                    stock.company.toLowerCase().includes(cleanQuery) ||
                    (stock.note || "").toLowerCase().includes(cleanQuery)
                );
            })
            .toSorted((a, b) => {
                if (sortBy === "symbol") return a.symbol.localeCompare(b.symbol);
                if (sortBy === "change") return (b.changePercent || 0) - (a.changePercent || 0);
                return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
            });
    }, [category, query, sortBy, watchlist]);

    return (
        <div className="watchlist-surface">
            <div className="watchlist-toolbar">
                <div className="watchlist-search-wrap">
                    <Search className="watchlist-search-icon" />
                    <input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        className="watchlist-search-input"
                        placeholder="Search symbols, companies, or notes"
                    />
                </div>
                <label className="watchlist-sort">
                    <ArrowDownAZ className="h-4 w-4" />
                    <select value={sortBy} onChange={(event) => setSortBy(event.target.value as "recent" | "symbol" | "change")}>
                        <option value="recent">Recently added</option>
                        <option value="symbol">Symbol A-Z</option>
                        <option value="change">Top movers</option>
                    </select>
                </label>
            </div>

            <div className="watchlist-category-filters">
                {categories.map((item) => (
                    <button
                        key={item}
                        type="button"
                        onClick={() => setCategory(item)}
                        className={`watchlist-filter-chip ${category === item ? "watchlist-filter-chip-active" : ""}`}
                    >
                        {item}
                    </button>
                ))}
            </div>

            {filteredWatchlist.length === 0 ? (
                <div className="watchlist-filter-empty">No stocks match that filter.</div>
            ) : (
                <>
                    <div className="watchlist-table desktop-watchlist-table">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[980px] border-collapse">
                                <thead>
                                <tr className="table-header-row">
                                    <th className="table-header p-4 text-left">Stock</th>
                                    <th className="table-header p-4 text-left">Category & Notes</th>
                                    <th className="table-header p-4 text-right">Price</th>
                                    <th className="table-header p-4 text-right">Change</th>
                                    <th className="table-header p-4 text-right">Market Cap</th>
                                    <th className="table-header p-4 text-right">P/E</th>
                                    <th className="table-header p-4 text-right">Remove</th>
                                </tr>
                                </thead>
                                <tbody>
                                {filteredWatchlist.map((stock) => (
                                    <tr key={stock.symbol} className="table-row">
                                        <td className="table-cell p-4">
                                            <Link href={`/stocks/${stock.symbol}`} className="flex flex-col">
                                                <span className="font-semibold text-gray-100">{stock.symbol}</span>
                                                <span className="text-sm text-gray-500">{stock.company}</span>
                                            </Link>
                                        </td>
                                        <td className="table-cell p-4">
                                            <WatchlistDetailsForm stock={stock} />
                                        </td>
                                        <td className="table-cell p-4 text-right">{stock.priceFormatted}</td>
                                        <td className={`table-cell p-4 text-right ${getChangeColorClass(stock.changePercent)}`}>
                                            {stock.changeFormatted}
                                        </td>
                                        <td className="table-cell p-4 text-right">{stock.marketCap}</td>
                                        <td className="table-cell p-4 text-right">{stock.peRatio}</td>
                                        <td className="table-cell p-4 text-right">
                                            <div className="flex justify-end">
                                                <WatchlistButton symbol={stock.symbol} company={stock.company} isInWatchlist type="icon" showTrashIcon />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="watchlist-card-grid">
                        {filteredWatchlist.map((stock) => (
                            <article key={stock.symbol} className="watchlist-mobile-card">
                                <div className="watchlist-card-header">
                                    <Link href={`/stocks/${stock.symbol}`} className="min-w-0">
                                        <h2>{stock.symbol}</h2>
                                        <p>{stock.company}</p>
                                    </Link>
                                    <WatchlistButton symbol={stock.symbol} company={stock.company} isInWatchlist type="icon" showTrashIcon />
                                </div>
                                <div className="watchlist-card-metrics">
                                    <div>
                                        <span>Price</span>
                                        <strong>{stock.priceFormatted}</strong>
                                    </div>
                                    <div>
                                        <span>Change</span>
                                        <strong className={getChangeColorClass(stock.changePercent)}>{stock.changeFormatted}</strong>
                                    </div>
                                    <div>
                                        <span>Market Cap</span>
                                        <strong>{stock.marketCap}</strong>
                                    </div>
                                    <div>
                                        <span>P/E</span>
                                        <strong>{stock.peRatio}</strong>
                                    </div>
                                </div>
                                <WatchlistDetailsForm stock={stock} />
                            </article>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default WatchlistView;
