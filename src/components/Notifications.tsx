import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import * as api from '../utils/api';
import { Notification, View } from '../../types';
import { BellIcon, CheckCircleIcon, AlertTriangleIcon, BookOpenIcon } from '../../components/icons';

interface NotificationsProps {
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
  setActiveView: (view: View) => void;
}

const timeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return "just now";
};


const Notifications: React.FC<NotificationsProps> = ({ addToast, setActiveView }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [hasUnread, setHasUnread] = useState(false);
    const [toastedIds, setToastedIds] = useState<Set<string>>(new Set());
    const dropdownRef = useRef<HTMLDivElement>(null);

    const pollNotifications = useCallback(async () => {
        if (!user) return;
        try {
            const all = await api.getNotificationsForUser(user.id);
            const newUnread = all.filter(n => !n.read && !toastedIds.has(n.id));
            
            if (newUnread.length > 0) {
                newUnread.forEach(n => addToast(n.message, n.type));
                setToastedIds(prev => new Set([...prev, ...newUnread.map(n => n.id)]));
            }
            
            setNotifications(all);
            setHasUnread(all.some(n => !n.read));
        } catch (e) {
            console.error("Failed to poll notifications", e);
        }
    }, [user, addToast, toastedIds]);

    useEffect(() => {
        pollNotifications(); // Initial fetch
        const intervalId = setInterval(pollNotifications, 7000); // Poll every 7 seconds
        return () => clearInterval(intervalId);
    }, [pollNotifications]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    
    const handleBellClick = async () => {
        const currentlyOpen = isOpen;
        setIsOpen(!currentlyOpen);

        if (!currentlyOpen && hasUnread) {
            if (!user) return;
            const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
            if (unreadIds.length > 0) {
                try {
                    await api.markNotificationsAsRead(user.id, unreadIds);
                    setHasUnread(false);
                     // Optimistically update the UI
                    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                } catch (e) {
                    console.error("Failed to mark notifications as read", e);
                }
            }
        }
    };
    
    const handleNotificationClick = (notification: Notification) => {
        if (notification.link) {
            setActiveView(notification.link);
            setIsOpen(false);
        }
    };

    const getIconForType = (type: Notification['type']) => {
        switch(type) {
            case 'success': return <CheckCircleIcon className="w-5 h-5 text-green-400"/>;
            case 'error': return <AlertTriangleIcon className="w-5 h-5 text-red-400"/>;
            case 'info': default: return <BookOpenIcon className="w-5 h-5 text-cyan-400"/>;
        }
    };

    return (
        <div ref={dropdownRef} className="relative">
            <button
                onClick={handleBellClick}
                className="relative p-3 -m-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10"
                aria-label={`Notifications (${hasUnread ? 'New' : 'No new'})`}
            >
                <BellIcon className="w-6 h-6" />
                {hasUnread && (
                    <span className="absolute top-1 right-1 block h-3 w-3 rounded-full bg-red-500 ring-2 ring-gray-100 dark:ring-[#0D1117]"></span>
                )}
            </button>
            {isOpen && (
                <div
                    className="absolute right-0 mt-2 w-80 bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl z-50 animate-scaleIn origin-top-right"
                    role="dialog"
                    aria-label="Notification history"
                >
                    <div className="p-3 font-semibold border-b border-white/10 text-gray-900 dark:text-white">
                        Notifications
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? (
                            notifications.map(n => (
                                <div
                                    key={n.id}
                                    onClick={() => handleNotificationClick(n)}
                                    className={`flex items-start gap-3 p-3 transition-colors ${n.link ? 'cursor-pointer hover:bg-gray-200/50 dark:hover:bg-white/10' : ''}`}
                                >
                                    <div className="flex-shrink-0 mt-1">{getIconForType(n.type)}</div>
                                    <div>
                                        <p className="text-sm text-gray-900 dark:text-gray-200">{n.message}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{timeAgo(n.createdAt)}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">You have no notifications.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Notifications;