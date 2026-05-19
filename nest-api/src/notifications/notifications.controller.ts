//nest-api/src/notifications/notifications.controller.ts
import { Controller, Get, Patch, Param, Req, UseGuards,Delete } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@Controller('api/notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('my')
  async my(@Req() req: any) {
    const userId = req?.user?.id || req?.user?.userId;
    return this.notificationsService.getMyNotifications(userId);
  }

  @Patch('read-all')
  async markAllRead(@Req() req: any) {
    const userId = req?.user?.id || req?.user?.userId;
    return this.notificationsService.markAllAsRead(userId);
  }

  @Patch(':id/read')
  async markRead(@Param('id') id: string, @Req() req: any) {
    const userId = req?.user?.id || req?.user?.userId;
    return this.notificationsService.markAsRead(id, userId);
  }

  @Delete()
  async removeAll(@Req() req: any) {
    const userId = req?.user?.id || req?.user?.userId;
    return this.notificationsService.removeAll(userId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.notificationsService.remove(id);
  }
}
