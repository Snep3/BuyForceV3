// src/users/users.service.ts
import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async signup(username: string, email: string, password: string) {
    if (!username || !email || !password) {
      throw new BadRequestException('All fields are required');
    }

    const existing = await this.userRepo.findOne({
      where: [{ email }, { username }],
    });

    if (existing) {
      throw new BadRequestException('User already exists');
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = this.userRepo.create({
      username,
      email,
      password: hashed,
      is_admin: false,
    });

    const saved = await this.userRepo.save(user);

    const { password: _, ...safe } = saved as any;
    return safe;
  }

  async login(email: string, password: string) {
    if (!email || !password) {
      throw new BadRequestException('Email and password are required');
    }

    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.signToken(user.id, !!user.is_admin);

    const { password: _, ...safe } = user as any;
    return { token, user: safe };
  }

  async getMe(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const { password: _, ...safe } = user as any;
    return safe;
  }

  // ✅ חדש: update profile
  async updateMyProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    user.fullName  = dto.fullName  ?? user.fullName;
    user.phone     = dto.phone     ?? user.phone;
    user.address   = dto.address   ?? user.address;
    if (dto.avatarUrl !== undefined) {
      user.avatarUrl = dto.avatarUrl || null;
    }

    const saved = await this.userRepo.save(user);

    const { password: _, ...safe } = saved as any;
    return safe;
  }

  async findAll() {
    const users = await this.userRepo.find({
      select: ['id', 'username', 'email', 'is_admin', 'createdAt'],
      order: { createdAt: 'DESC' },
    });
    return users;
  }

  private signToken(id: string, is_admin: boolean) {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET not set');

    return jwt.sign({ id, is_admin }, secret, { expiresIn: '7d' });
  }
}
