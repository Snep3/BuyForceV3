// src/database/database.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Product } from '../products/product.entity';
import { Comment } from '../products/comment.entity';
import { User } from '../users/user.entity';
import { Group } from '../groups/group.entity';
import { Order } from '../orders/order.entity';
import { OrderItem } from '../orders/order-item.entity';
import { GroupMember } from '../groups/group-member.entity';
import { WishlistItem } from '../wishlist/wishlist.entity';
import { Notification } from '../notifications/notification.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const nodeEnv = config.get<string>('NODE_ENV', 'development');
        const isProd = nodeEnv === 'production';

        console.log('DB_HOST =', config.get('DB_HOST'));
console.log('DB_USER =', config.get('DB_USER'));
console.log('DB_DATABASE =', config.get('DB_DATABASE'));

        return {
          type: 'postgres',

          host: config.get<string>('DB_HOST'),
          port: Number(config.get<number | string>('DB_PORT', 5432)),
          username: config.get<string>('DB_USER'),
          password: config.get<string>('DB_PASSWORD'),
          database: config.get<string>('DB_DATABASE'),

          entities: [
            Product,
            Comment,
            User,
            Group,
            Order,
            OrderItem,
            GroupMember,
            WishlistItem,
            Notification,
          ],

          ssl: config.get('DB_SSL') === 'true' ? { rejectUnauthorized: false } : false,

          // ✅ חשוב: בפרודקשן לא עושים synchronize אוטומטי
          synchronize: !isProd,
          logging: !isProd,
        };
      },
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
