"use client";

import React, { FormEvent, useState, useTransition } from "react";
import { toast } from "sonner";

import { updateWatchlistDetails } from "@/lib/actions/watchlist.actions";

const WatchlistDetailsForm = ({ stock }: { stock: StockWithData }) => {
    const [note, setNote] = useState(stock.note || "");
    const [category, setCategory] = useState(stock.category || "General");
    const [isPending, startTransition] = useTransition();

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        startTransition(async () => {
            const result = await updateWatchlistDetails(stock.symbol, { note, category });

            if (!result.success) {
                toast.error(result.error || "Failed to update stock details");
                return;
            }

            toast.success(`${stock.symbol} details saved`);
        });
    };

    return (
        <form onSubmit={handleSubmit} className="watchlist-details-form">
            <input
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="watchlist-category-input"
                placeholder="Category"
                aria-label={`${stock.symbol} category`}
            />
            <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                className="watchlist-note-input"
                placeholder="Add a note"
                aria-label={`${stock.symbol} note`}
                rows={2}
            />
            <button type="submit" disabled={isPending} className="watchlist-detail-save">
                {isPending ? "Saving..." : "Save"}
            </button>
        </form>
    );
};

export default WatchlistDetailsForm;
