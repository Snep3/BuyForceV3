// src/users/users.controller.ts
import { Body, Controller, Get, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';


@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('signup')
  async signup(
    @Body() body: { username: string; email: string; password: string },
  ) {
    return this.usersService.signup(body.username, body.email, body.password);
  }

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    return this.usersService.login(body.email, body.password);
  }

  @Get('all')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async findAll() {
    return this.usersService.findAll();
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: any) {
    const userId = req?.user?.id || req?.user?.userId;
    return this.usersService.getMe(userId);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async updateMe(@Req() req: any, @Body() dto: UpdateProfileDto) {
    const userId = req?.user?.id || req?.user?.userId;
    return this.usersService.updateMyProfile(userId, dto);
  }
}
