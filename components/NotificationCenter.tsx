"use client";

import React, { useTransition } from "react";
import Link from "next/link";
import { Bell, Inbox } from "lucide-react";
import { useRouter } from "next/navigation";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { markNotificationsRead } from "@/lib/actions/notification.actions";
import { formatTimeAgo } from "@/lib/utils";

const NotificationCenter = ({ notifications, unreadCount }: { notifications: AppNotification[]; unreadCount: number }) => {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const handleMarkRead = () => {
        startTransition(async () => {
            await markNotificationsRead();
            router.refresh();
        });
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <button className="notification-trigger" aria-label="Open notifications">
                    <Bell className="h-5 w-5" />
                    <span className="notification-trigger-label">Alerts</span>
                    {unreadCount > 0 && <span className="notification-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>}
                </button>
            </DialogTrigger>
            <DialogContent className="notification-drawer">
                <DialogHeader>
                    <div className="notification-drawer-top">
                        <div>
                            <DialogTitle className="notification-drawer-title">Notifications</DialogTitle>
                            <DialogDescription className="notification-drawer-description">
                                Alerts and updates from your watchlist.
                            </DialogDescription>
                        </div>
                        <button type="button" onClick={handleMarkRead} disabled={isPending || unreadCount === 0} className="notification-read-btn">
                            Mark read
                        </button>
                    </div>
                </DialogHeader>

                {notifications.length === 0 ? (
                    <div className="notification-empty">
                        <Inbox className="mx-auto mb-3 h-8 w-8 text-gray-600" />
                        No notifications yet.
                    </div>
                ) : (
                    <div className="notification-drawer-list">
                        {notifications.map((notification) => (
                            <Link key={notification.id} href={notification.url || "/watchlist"} className="notification-item">
                                <span className={`notification-dot ${notification.isRead ? "notification-dot-read" : ""}`} />
                                <span className="notification-content">
                                    <span className="notification-title">{notification.title}</span>
                                    <span className="notification-message">{notification.message}</span>
                                    <span className="notification-time">
                                        {formatTimeAgo(Math.floor(new Date(notification.createdAt).getTime() / 1000))}
                                    </span>
                                </span>
                            </Link>
                        ))}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default NotificationCenter;
