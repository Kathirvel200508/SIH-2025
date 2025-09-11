import { Injectable } from '@nestjs/common';

export interface NotificationItem {
  id: string;
  userId: string;
  message: string;
  createdAt: string;
  read: boolean;
}

@Injectable()
export class NotificationsService {
  private items: NotificationItem[] = [];

  addNotification(userId: string, message: string): NotificationItem {
    const item: NotificationItem = {
      id: (this.items.length + 1).toString(),
      userId,
      message,
      createdAt: new Date().toISOString(),
      read: false,
    };
    this.items.unshift(item);
    return item;
  }

  listForUser(userId: string): NotificationItem[] {
    return this.items.filter((n) => n.userId === userId);
  }

  markAllRead(userId: string): void {
    this.items.forEach((n) => {
      if (n.userId === userId) n.read = true;
    });
  }
}













