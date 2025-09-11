import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private readonly notifications;
    constructor(notifications: NotificationsService);
    list(req: any): import("./notifications.service").NotificationItem[];
    markRead(req: any): {
        ok: boolean;
    };
}
