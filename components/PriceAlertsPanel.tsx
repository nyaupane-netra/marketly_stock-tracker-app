"use client";

import React, { FormEvent, useMemo, useState, useTransition } from "react";
import { Bell, BellRing, Mail, Target, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { createPriceAlert, deletePriceAlert } from "@/lib/actions/alert.actions";
import { formatPrice, getAlertText } from "@/lib/utils";

const PriceAlertsPanel = ({ watchlist, alerts }: { watchlist: StockWithData[]; alerts: Alert[] }) => {
    const router = useRouter();
    const [symbol, setSymbol] = useState(watchlist[0]?.symbol || "");
    const [alertType, setAlertType] = useState<"upper" | "lower">("upper");
    const [threshold, setThreshold] = useState("");
    const [alertName, setAlertName] = useState("");
    const [isPending, startTransition] = useTransition();

    const selectedStock = useMemo(
        () => watchlist.find((stock) => stock.symbol === symbol) || watchlist[0],
        [symbol, watchlist]
    );

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!selectedStock) {
            toast.error("Add a stock to your watchlist first.");
            return;
        }

        startTransition(async () => {
            const result = await createPriceAlert({
                symbol: selectedStock.symbol,
                company: selectedStock.company,
                alertName: alertName || `${selectedStock.symbol} ${alertType === "upper" ? "above" : "below"} alert`,
                alertType,
                threshold,
            });

            if (!result.success) {
                toast.error(result.error || "Failed to create alert");
                return;
            }

            setAlertName("");
            setThreshold("");
            toast.success("Price alert created");
            router.refresh();
        });
    };

    const handleDelete = (alertId: string) => {
        startTransition(async () => {
            const result = await deletePriceAlert(alertId);

            if (!result.success) {
                toast.error(result.error || "Failed to delete alert");
                return;
            }

            toast.success("Price alert deleted");
            router.refresh();
        });
    };

    return (
        <div className="alert-list">
            <div className="alert-panel-header">
                <div className="alert-panel-heading">
                    <span className="alert-panel-icon">
                        <BellRing className="h-5 w-5" />
                    </span>
                    <div>
                    <h2 className="alert-panel-title">Price alerts</h2>
                    <p className="alert-panel-copy">Get emailed when a watchlist stock crosses your target.</p>
                    </div>
                </div>
                <span className="alert-count-pill">{alerts.filter((alert) => alert.active).length} active</span>
            </div>

            <form onSubmit={handleSubmit} className="alert-form">
                <div className="alert-form-header">
                    <Target className="h-4 w-4 text-yellow-500" />
                    <span>New alert</span>
                </div>

                <div className="alert-form-grid">
                    <label className="alert-form-field">
                        <span>Stock</span>
                        <select value={symbol} onChange={(event) => setSymbol(event.target.value)} className="alert-input">
                            {watchlist.map((stock) => (
                                <option key={stock.symbol} value={stock.symbol}>{stock.symbol}</option>
                            ))}
                        </select>
                    </label>

                    <label className="alert-form-field">
                        <span>Direction</span>
                        <select value={alertType} onChange={(event) => setAlertType(event.target.value as "upper" | "lower")} className="alert-input">
                            <option value="upper">Goes above</option>
                            <option value="lower">Drops below</option>
                        </select>
                    </label>

                    <label className="alert-form-field">
                        <span>Target price</span>
                        <input value={threshold} onChange={(event) => setThreshold(event.target.value)} className="alert-input" placeholder="225.00" type="number" min="0" step="0.01" />
                    </label>

                    <label className="alert-form-field">
                        <span>Alert name</span>
                        <input value={alertName} onChange={(event) => setAlertName(event.target.value)} className="alert-input" placeholder="Breakout watch" />
                    </label>
                </div>

                <button type="submit" disabled={isPending || !watchlist.length} className="alert-create-btn">
                    <Mail className="h-4 w-4" />
                    Create alert
                </button>
            </form>

            {alerts.length === 0 ? (
                <div className="alert-empty">
                    <Bell className="mx-auto mb-3 h-6 w-6" />
                    Create your first email price alert.
                </div>
            ) : (
                <div className="alert-items">
                    <div className="alert-items-header">Saved alerts</div>
                    {alerts.map((alert) => (
                        <div key={alert.id} className={`alert-item ${!alert.active ? "alert-item-inactive" : ""}`}>
                            <div className="alert-details">
                                <div>
                                    <p className="alert-name">{alert.alertName}</p>
                                    <p className="alert-company">{alert.symbol} · {alert.company}</p>
                                </div>
                                <button type="button" onClick={() => handleDelete(alert.id)} disabled={isPending} className="alert-delete-btn" aria-label={`Delete ${alert.alertName}`}>
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                            <div className="alert-actions">
                                <span>{getAlertText(alert)}</span>
                                <span className="alert-price">{alert.currentPrice ? formatPrice(alert.currentPrice) : "N/A"}</span>
                            </div>
                            {!alert.active && <p className="alert-triggered-label">Triggered</p>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PriceAlertsPanel;
