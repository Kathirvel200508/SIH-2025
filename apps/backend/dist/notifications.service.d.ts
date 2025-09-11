export interface NotificationItem {
    id: string;
    userId: string;
    message: string;
    createdAt: string;
    read: boolean;
}
export declare class NotificationsService {
    private items;
    addNotification(userId: string, message: string): NotificationItem;
    listForUser(userId: string): NotificationItem[];
    markAllRead(userId: string): void;
}
