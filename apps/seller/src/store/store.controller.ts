import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StoreService } from './store.service';
import { CreateStoreDto, UpdateStoreStatusDto } from './dto';
import { Seller } from '@app/shared/entities';

/**
 * Store Controller
 * Handles HTTP requests for store profile management
 * All endpoints are protected with JWT authentication
 */
@Controller('store')
@UseGuards(JwtAuthGuard)
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  /**
   * POST /store/onboarding
   * Create a new store profile for the authenticated user
   * @param req - Express request with authenticated user info
   * @param dto - Create store profile data
   * @returns The created seller profile
   */
  @Post('onboarding')
  @HttpCode(HttpStatus.CREATED)
  async createStoreProfile(
    @Request() req: any,
    @Body() dto: CreateStoreDto,
  ): Promise<Seller> {
    const userId = req.user.userId;
    console.log('Creating store profile for user:', userId);
    return this.storeService.createStoreProfile(userId, dto);
  }

  /**
   * GET /store/profile
   * Retrieve the authenticated user's store profile
   * @param req - Express request with authenticated user info
   * @returns The seller profile
   */
  @Get('profile')
  @HttpCode(HttpStatus.OK)
  async getMyStore(@Req() req: any): Promise<Seller> {
    const userId = req.user.userId;
    return this.storeService.getMyStore(userId);
  }

  /**
   * PATCH /store/status
   * Update the store's open/closed status
   * @param req - Express request with authenticated user info
   * @param dto - Update status data
   * @returns The updated seller profile
   */
  @Patch('status')
  @HttpCode(HttpStatus.OK)
  async setStoreStatus(
    @Req() req: any,
    @Body() dto: UpdateStoreStatusDto,
  ): Promise<Seller> {
    const userId = req.user.userId;
    return this.storeService.setStoreStatus(userId, dto);
  }
}
