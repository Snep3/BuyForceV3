//nest-api/src/notifications/notifications.service.ts
import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationsRepo: Repository<Notification>,
  ) {}

  async getMyNotifications(userId: string) {
    return this.notificationsRepo.find({
      where: { user: { id: userId } },
      relations: { user: false },
      order: { createdAt: 'DESC' },
    });
  }
  async createNotification(userId: string, data: { type: string; message: string }) {
  const notification = this.notificationsRepo.create({
    user: { id: userId },
    type: data.type,
    message: data.message,
  });
  return this.notificationsRepo.save(notification);
}

  async markAsRead(notificationId: string, userId: string) {
    const notification = await this.notificationsRepo.findOne({
      where: { id: notificationId },
      relations: { user: true },
    });

    if (!notification) throw new NotFoundException('Notification not found');
    if (notification.user?.id !== userId) throw new ForbiddenException('Not yours');

    if (!notification.isRead) {
      notification.isRead = true;
      await this.notificationsRepo.save(notification);
    }

    const { user, ...safe } = notification as any;
    return safe;
  }
  async remove(id: string) {
    const result = await this.notificationsRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Notification with ID "${id}" not found`);
    }
    return { success: true };
  }

  async markAllAsRead(userId: string) {
    await this.notificationsRepo.update(
      { user: { id: userId }, isRead: false },
      { isRead: true },
    );
    return { success: true };
  }

  async removeAll(userId: string) {
    await this.notificationsRepo.delete({ user: { id: userId } });
    return { success: true };
  }
}
