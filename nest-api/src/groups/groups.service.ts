// src/groups/groups.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Group } from './group.entity';
import { GroupMember } from './group-member.entity';
import { Product } from '../products/product.entity';
import { User } from '../users/user.entity';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { OrdersService } from '../orders/orders.service';
import { Order } from '../orders/order.entity';
import { NotificationsService } from 'src/notifications/notifications.service';
import * as fs from 'fs';
import * as path from 'path';

const GROUPS_SEED_FILE = path.join(process.cwd(), 'groups.seed.json');

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private readonly groupRepo: Repository<Group>,

    @InjectRepository(GroupMember)
    private readonly groupMemberRepo: Repository<GroupMember>,

    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
  
    private readonly ordersService: OrdersService,
  
    private readonly notificationsService: NotificationsService, 
) {}

  // --- עדכון: שליחה לכל החברים ללא החרגה ---
  private async notifyAllMembers(groupId: string, data: { type: string; message: string }) {
    const members = await this.groupMemberRepo.find({ where: { groupId } });
    const promises = members
      .map(m => this.notificationsService.createNotification(m.userId, data));
    await Promise.all(promises);
  }

  // -------------------------------------------------
  // חבילה 1 – לוגיקת קבוצות למשתמשים
  // -------------------------------------------------

  async getAllGroups() {
    const groups = await this.groupRepo.find({
      where: { isCompleted: false },
      relations: ['product', 'members'],
      order: { createdAt: 'DESC' },
    });
    const now = new Date();

    return groups.map((g) => {
      const currentParticipants = g.members ? g.members.length : 0;
      const isExpired = g.deadline && now > new Date(g.deadline);
      const progress =
        g.minParticipants > 0
          ? Math.min(
              100,
              Math.round((currentParticipants / g.minParticipants) * 100),
            )
          : 0;

      const discountPercent = Number(g.discountPercent ?? 0);
      const originalPrice = g.product?.price != null ? Number(g.product.price) : null;
      const discountedPrice = originalPrice != null && discountPercent > 0
        ? Math.round(originalPrice * (1 - discountPercent / 100) * 100) / 100
        : originalPrice;

      return {
        id: g.id,
        name: g.name,
        description: g.product?.description,
        minParticipants: g.minParticipants,
        isActive: isExpired ? false : g.isActive,
        isExpired: !!isExpired,
        deadline: g.deadline,
        productId: g.productId,
        product: g.product,
        currentParticipants,
        progress,
        isCompleted: g.isCompleted,
        discountPercent,
        discountedPrice,
      };
    });
  }

  async getUserGroups(userId: string) {
    if (!userId) throw new BadRequestException('User not authenticated');

    const memberships = await this.groupMemberRepo.find({
      where: { userId },
      relations: ['group', 'group.product', 'group.members'],
      order: { joinedAt: 'DESC' },
    });

    const now = new Date();
    return memberships.map((m) => {
      const g = m.group;
      const currentParticipants = g.members ? g.members.length : 0;
      const isExpired = !!(g.deadline && now > new Date(g.deadline));

      const progress =
        g.minParticipants > 0
          ? Math.min(
              100,
              Math.round((currentParticipants / g.minParticipants) * 100),
            )
          : 0;

      const discountPercent = Number(g.discountPercent ?? 0);
      const originalPrice = g.product?.price != null ? Number(g.product.price) : null;
      const discountedPrice = originalPrice != null && discountPercent > 0
        ? Math.round(originalPrice * (1 - discountPercent / 100) * 100) / 100
        : originalPrice;

      return {
        id: g.id,
        name: g.name,
        description: g.product?.description,
        minParticipants: g.minParticipants,
        isActive: isExpired ? false : g.isActive,
        isExpired,
        isCompleted: g.isCompleted,
        deadline: g.deadline,
        productId: g.productId,
        product: g.product,
        currentParticipants,
        progress,
        joinedAt: m.joinedAt,
        discountPercent,
        discountedPrice,
      };
    });
  }

async joinGroupWithPayment(userId: string, groupId: string) {
    if (!userId) {
      throw new BadRequestException('User not authenticated');
    }

    const group = await this.groupRepo.findOne({
      where: { id: groupId },
      relations: ['members', 'product'],
    });

    if (!group) throw new NotFoundException('Group not found');
    
    if (group.deadline && new Date() > new Date(group.deadline)) {
      throw new BadRequestException('The deadline for this group has passed');
    }
    
    if (!group.isActive) throw new BadRequestException('Group is not active');
    if (group.isCompleted) throw new BadRequestException('Group already completed');

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const existingMembership = await this.groupMemberRepo.findOne({
      where: { groupId: group.id, userId: user.id },
    });

    if (existingMembership) {
      return { joined: false, alreadyMember: true, message: 'Already joined this group' };
    }

    if (group.productId) {
      try {
        await this.ordersService.createOrder(userId, {
          groupId: group.id,
          productId: group.productId,
          quantity: 1,
          status: 'pending',
        });
      } catch (err) {
        console.error('Auto-order creation failed:', err);
      }
    }

    const membership = this.groupMemberRepo.create({
      group,
      groupId: group.id,
      user,
      userId: user.id,
    });
    await this.groupMemberRepo.save(membership);

    await this.notificationsService.createNotification(userId, {
      type: 'GROUP_JOIN',
      message: `You've joined the group "${group.name}".`,
    });

    const currentCount = await this.groupMemberRepo.count({
      where: { groupId: group.id },
    });

    const remaining = group.minParticipants - currentCount;
    // עדכון: שליחה לכולם כולל המשתמש שהרגע הצטרף
    if (remaining > 0 && remaining <= 3) {
      await this.notifyAllMembers(group.id, {
        type: 'GROUP_THRESHOLD',
        message: `Almost there! Only ${remaining} more member${remaining !== 1 ? 's' : ''} needed to complete "${group.name}".`,
      });
    }

    if (currentCount >= group.minParticipants) {
      await this.groupRepo.update(group.id, {
        isCompleted: true,
        completedAt: new Date()
      });

      await this.orderRepo.update(
        { groupId: group.id, status: 'pending' },
        { status: 'completed' }
      );

      const members = await this.groupMemberRepo.find({ where: { groupId: group.id } });
      for (const member of members) {
        await this.notificationsService.createNotification(member.userId, {
          type: 'GROUP_COMPLETED',
          message: `Group complete! Your order for "${group.name}" has been confirmed.`,
        });
      }
    }

    return {
      joined: true,
      alreadyMember: false,
      groupId: group.id,
      currentParticipants: currentCount,
      minParticipants: group.minParticipants,
      isCompleted: currentCount >= group.minParticipants,
    };
}

 async leaveGroup(userId: string, groupId: string) {
    if (!userId) throw new BadRequestException('User not authenticated');

    const group = await this.groupRepo.findOne({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Group not found');

    if (!group.isActive || group.isCompleted) {
      throw new BadRequestException('Cannot leave a completed or inactive group');
    }

    const membership = await this.groupMemberRepo.findOne({
      where: { groupId: group.id, userId },
    });

    if (!membership) {
      throw new BadRequestException('User is not a member of this group');
    }

    try {
      await this.orderRepo.delete({ 
        userId: userId, 
        groupId: groupId, 
        status: 'pending' 
      });
    } catch (err) {
      console.error("Failed to delete order upon leaving group:", err);
    }

    await this.groupMemberRepo.remove(membership);

    await this.notificationsService.createNotification(userId, {
      type: 'GROUP_LEAVE',
      message: `You've left the group "${group.name}". Your order has been cancelled.`,
    });

    const membersCount = await this.groupMemberRepo.count({
      where: { groupId: group.id },
    });

    const progress =
      group.minParticipants > 0
        ? Math.min(
            100,
            Math.round((membersCount / group.minParticipants) * 100),
          )
        : 0;

    return {
      id: group.id,
      currentParticipants: membersCount,
      progress,
      message: 'Successfully left the group and cancelled order'
    };
  }

  async getActiveGroupByProduct(productId: string) {
    const group = await this.groupRepo.findOne({
      where: { productId, isActive: true, isCompleted: false },
      relations: ['members', 'product'],
    });

    if (!group) return null;
    if (group.deadline && new Date() > new Date(group.deadline)) return null;

    const membersCount = await this.groupMemberRepo.count({
      where: { groupId: group.id },
    });

    const progress =
      group.minParticipants > 0
        ? Math.min(100, Math.round((membersCount / group.minParticipants) * 100))
        : 0;

    const discountPercent = Number(group.discountPercent ?? 0);
    const originalPrice = group.product?.price != null ? Number(group.product.price) : null;
    const discountedPrice =
      originalPrice != null && discountPercent > 0
        ? Math.round(originalPrice * (1 - discountPercent / 100) * 100) / 100
        : originalPrice;

    return {
      id: group.id,
      name: group.name,
      description: group.description,
      minParticipants: group.minParticipants,
      isActive: group.isActive,
      deadline: group.deadline,
      productId: group.productId,
      product: group.product,
      currentParticipants: membersCount,
      progress,
      discountPercent,
      discountedPrice,
    };
  }
  // src/groups/groups.service.ts

async getGroupById(id: string) {
  // אנחנו משתמשים ב-findOne כדי למצוא קבוצה לפי ה-ID שלה
  // ומוסיפים relations כדי להביא גם את פרטי המוצר המשויך לקבוצה
  const group = await this.groupRepo.findOne({
    where: { id },
    relations: ['product'], 
  });

  // אם הקבוצה לא נמצאה, נחזיר שגיאה מתאימה
  if (!group) {
    throw new NotFoundException(`Group with ID ${id} not found`);
  }

  return group;
}

  async findAll() {
    return this.getAllGroups();
  }

  async findOne(id: string) {
    const group = await this.groupRepo.findOne({
      where: { id },
      relations: ['product'],
    });

    if (!group) throw new NotFoundException('Group not found');
    return group;
  }

  async create(dto: CreateGroupDto) {
    let product: Product | null = null;
    try {
      product = await this.productRepo.findOne({ where: { id: dto.productId } });
    } catch {
      throw new BadRequestException('Invalid product ID format');
    }
    if (!product) throw new BadRequestException('Product not found');

    const allExisting = await this.groupRepo.find({
      where: { productId: dto.productId },
    });
    const now = new Date();
    for (const g of allExisting) {
      const isExpired = g.deadline && now > new Date(g.deadline);
      if (g.isActive && !g.isCompleted && !isExpired) {
        throw new BadRequestException('An active group already exists for this product');
      }
    }

    const group = this.groupRepo.create({
      name: dto.name,
      minParticipants: dto.minParticipants,
      isActive: dto.isActive ?? true,
      product,
      deadline: dto.deadline,
      productId: product.id,
      discountPercent: dto.discountPercent ?? 0,
    });

    if (dto.description !== undefined) group.description = dto.description;

    const saved = await this.groupRepo.save(group);
    void this.syncGroupsSeedFile();
    return saved;
  }

  async update(id: string, dto: UpdateGroupDto) {
    const group = await this.groupRepo.findOne({ where: { id } });
    if (!group) throw new NotFoundException('Group not found');

    if (dto.name !== undefined) group.name = dto.name;
    if (dto.description !== undefined) group.description = dto.description;
    if (dto.minParticipants !== undefined)
      group.minParticipants = dto.minParticipants;
    if (dto.isActive !== undefined) {
      if (dto.isActive === false && group.isActive !== false) {
        await this.orderRepo.update(
          { groupId: group.id, status: 'pending' },
          { status: 'cancelled' },
        );
      }
      group.isActive = dto.isActive;
    }
    if (dto.deadline !== undefined) group.deadline = dto.deadline ? new Date(dto.deadline) : null;
    if (dto.discountPercent !== undefined) group.discountPercent = dto.discountPercent;

    if (dto.productId !== undefined) {
      let product: Product | null = null;
      try {
        product = await this.productRepo.findOne({ where: { id: dto.productId } });
      } catch {
        throw new BadRequestException('Invalid product ID format');
      }
      if (!product) throw new BadRequestException('Product not found');

      group.product = product;
      group.productId = product.id;
    }

    const saved = await this.groupRepo.save(group);
    void this.syncGroupsSeedFile();
    return saved;
  }

  async remove(id: string) {
    const group = await this.groupRepo.findOne({ where: { id } });
    if (!group) throw new NotFoundException('Group not found');

    await this.orderRepo.update(
      { groupId: group.id, status: 'pending' },
      { status: 'cancelled' },
    );

    await this.groupRepo.remove(group);
    void this.syncGroupsSeedFile();
    return { success: true };
  }

  private async syncGroupsSeedFile(): Promise<void> {
    const groups = await this.groupRepo.find();
    const data = groups.map((g) => ({
      id: g.id,
      name: g.name,
      description: g.description ?? null,
      minParticipants: g.minParticipants,
      isActive: g.isActive,
      isCompleted: g.isCompleted,
      productId: g.productId ?? null,
      deadline: g.deadline ?? null,
      discountPercent: Number(g.discountPercent ?? 0),
    }));
    fs.writeFileSync(GROUPS_SEED_FILE, JSON.stringify(data, null, 2), 'utf-8');
  }
}