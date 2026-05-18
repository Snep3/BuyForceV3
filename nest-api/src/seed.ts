import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';

import { User } from './users/user.entity';
import { Product } from './products/product.entity';
import { Group } from './groups/group.entity';
import { GroupMember } from './groups/group-member.entity';
import { Order } from './orders/order.entity';
import { OrderItem } from './orders/order-item.entity';
import { Comment } from './products/comment.entity';
import { Notification } from './notifications/notification.entity';
import { WishlistItem } from './wishlist/wishlist.entity';

const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    synchronize: false,
    logging: ['error'],
    entities: [
        User,
        Product,
        Group,
        GroupMember,
        Order,
        OrderItem,
        Comment,
        Notification,
        WishlistItem,
    ],
});

function loadJson<T>(filename: string): T[] {
    const filePath = path.join(process.cwd(), filename);
    if (!fs.existsSync(filePath)) {
        console.warn(`⚠️  ${filename} not found, skipping.`);
        return [];
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T[];
}

async function seed() {
    await AppDataSource.initialize();

    await AppDataSource.query(`
    TRUNCATE
      "order_items",
      "orders",
      "group_members",
      "wishlist",
      "notifications",
      "comments",
      "groups",
      "products",
      "users"
    RESTART IDENTITY CASCADE;
  `);

    const userRepo = AppDataSource.getRepository(User);
    const productRepo = AppDataSource.getRepository(Product);
    const groupRepo = AppDataSource.getRepository(Group);

    // === 1) Users (default accounts) ===
    const pass123 = await bcrypt.hash('123456', 10);
    await userRepo.save([
        userRepo.create({
            email: 'admin1@test.com',
            password: pass123,
            username: 'admin1',
            is_admin: true,
            fullName: 'Admin One',
            phone: '050-0000000',
            address: 'Tel Aviv',
        }),
        userRepo.create({
            email: 'user1@test.com',
            password: pass123,
            username: 'user1',
            is_admin: false,
            fullName: 'User One',
            phone: '050-1111111',
            address: 'Jerusalem',
        }),
        userRepo.create({
            email: 'user2@test.com',
            password: pass123,
            username: 'user2',
            is_admin: false,
            fullName: 'User Two',
            phone: '050-2222222',
            address: 'Haifa',
        }),
    ]);

    // === 2) Products (from products.seed.json) ===
    const productsData = loadJson<{
        id: string;
        name: string;
        price: number | string;
        category: string;
        stock: number;
        description?: string | null;
        imageUrl?: string | null;
    }>('products.seed.json');

    for (const p of productsData) {
        await productRepo.save(
            productRepo.create({
                id: p.id,
                name: p.name,
                price: Number(p.price),
                category: p.category,
                stock: p.stock ?? 0,
                description: p.description ?? null,
                imageUrl: p.imageUrl ?? null,
            }),
        );
    }
    console.log(`✅ Inserted ${productsData.length} products`);

    // === 3) Groups (from groups.seed.json) ===
    const groupsData = loadJson<{
        id: string;
        name: string;
        description?: string | null;
        minParticipants: number;
        isActive: boolean;
        isCompleted: boolean;
        productId?: string | null;
        deadline?: string | null;
        discountPercent?: number;
    }>('groups.seed.json');

    for (const g of groupsData) {
        await groupRepo.save(
            groupRepo.create({
                id: g.id,
                name: g.name,
                description: g.description ?? null,
                minParticipants: g.minParticipants,
                isActive: g.isActive,
                isCompleted: g.isCompleted,
                productId: g.productId ?? null,
                deadline: g.deadline ? new Date(g.deadline) : null,
                discountPercent: g.discountPercent ?? 0,
            }),
        );
    }
    console.log(`✅ Inserted ${groupsData.length} groups`);

    console.log('✅ Seed completed');
    await AppDataSource.destroy();
}

seed().catch(async (err) => {
    console.error('❌ Seed failed:', err);
    if (AppDataSource.isInitialized) await AppDataSource.destroy();
    process.exit(1);
});
