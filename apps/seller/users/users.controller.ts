import {
  Controller,
  Get,
  UseGuards,
  Request,
  NotFoundException,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  async getProfile(@Request() req) {
    const user = await this.usersService.findById(req.user.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    // Return user without password
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async findAll(@Query('page') page: number = 1, @Query('limit') limit: number = 10) {
    // Ensure limit is not excessive
    limit = limit > 100 ? 100 : limit;
    return this.usersService.findAll(page, limit);
  }
}