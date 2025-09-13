import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(@Req() req: any) {
    const userId = req.user?.userId ?? 'unknown';
    return this.notifications.listForUser(userId);
  }

  @Post('read-all')
  markRead(@Req() req: any) {
    const userId = req.user?.userId ?? 'unknown';
    this.notifications.markAllRead(userId);
    return { ok: true };
  }
}















