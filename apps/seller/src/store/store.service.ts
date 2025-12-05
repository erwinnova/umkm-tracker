import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Seller, User, SellerSession } from '@app/shared/entities';
import { CreateStoreDto, UpdateStoreStatusDto } from './dto';

/**
 * Store Service
 * Manages seller store profiles including creation, retrieval, and status updates
 * Also handles work session tracking (clock-in/clock-out)
 */
@Injectable()
export class StoreService {
  private readonly logger = new Logger(StoreService.name);

  constructor(
    @InjectRepository(Seller)
    private readonly sellerRepository: Repository<Seller>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(SellerSession)
    private readonly sessionRepository: Repository<SellerSession>,
  ) {}

  /**
   * Create a new store profile for a user
   * @param userId - The authenticated user's ID
   * @param dto - Create store profile data
   * @returns The created seller profile
   * @throws BadRequestException if user already has a store
   */
  async createStoreProfile(
    userId: string,
    dto: CreateStoreDto,
  ): Promise<Seller> {
    this.logger.debug(
      `Creating store profile for user: ${userId}`,
      'createStoreProfile',
    );

    // Check if user already has a seller profile
    const existingSeller = await this.sellerRepository.findOne({
      where: { userId },
    });

    if (existingSeller) {
      this.logger.warn(
        `User ${userId} attempted to create store but already has one`,
        'createStoreProfile',
      );
      throw new BadRequestException('User already has a store');
    }

    // Verify user exists
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      this.logger.warn(
        `Attempted to create store for non-existent user: ${userId}`,
        'createStoreProfile',
      );
      throw new NotFoundException('User not found');
    }

    // Create new seller entity
    const seller = this.sellerRepository.create({
      userId,
      storeName: dto.storeName,
      description: dto.description || null,
      category: dto.category || null,
      bannerUrl: dto.bannerUrl || null,
      isOpen: false, // Default to closed
    });

    const createdSeller = await this.sellerRepository.save(seller);
    this.logger.log(
      `Store profile created successfully for user ${userId}`,
      'createStoreProfile',
    );

    return createdSeller;
  }

  /**
   * Get the authenticated user's store profile
   * @param userId - The authenticated user's ID
   * @returns The seller profile
   * @throws NotFoundException if user has no store
   */
  async getMyStore(userId: string): Promise<Seller> {
    this.logger.debug(
      `Fetching store profile for user: ${userId}`,
      'getMyStore',
    );

    const seller = await this.sellerRepository.findOne({
      where: { userId },
    });

    if (!seller) {
      this.logger.warn(
        `Store profile not found for user: ${userId}`,
        'getMyStore',
      );
      throw new NotFoundException('Store profile not found');
    }

    return seller;
  }

  /**
   * Update the store open/closed status
   * Also handles work session tracking:
   * - If isOpen = true: Creates a new SellerSession (clock-in)
   * - If isOpen = false: Closes the latest active session (clock-out)
   *
   * @param userId - The authenticated user's ID
   * @param dto - Update status data (isOpen boolean)
   * @returns The updated seller profile
   * @throws NotFoundException if user has no store
   */
  async setStoreStatus(
    userId: string,
    dto: UpdateStoreStatusDto,
  ): Promise<Seller> {
    this.logger.debug(
      `Updating store status for user: ${userId}, isOpen: ${dto.isOpen}`,
      'setStoreStatus',
    );

    const seller = await this.sellerRepository.findOne({
      where: { userId },
    });

    if (!seller) {
      this.logger.warn(
        `Store profile not found for user: ${userId}`,
        'setStoreStatus',
      );
      throw new NotFoundException('Store profile not found');
    }

    // Handle session tracking based on status change
    if (dto.isOpen === true) {
      // CLOCK-IN: Create a new work session
      await this.createWorkSession(seller.id);
      this.logger.log(
        `Work session started (clock-in) for seller ${seller.id}`,
        'setStoreStatus',
      );
    } else if (dto.isOpen === false) {
      // CLOCK-OUT: Close the latest active session
      await this.closeWorkSession(seller.id);
      this.logger.log(
        `Work session ended (clock-out) for seller ${seller.id}`,
        'setStoreStatus',
      );
    }

    // Update the store status
    seller.isOpen = dto.isOpen;
    const updatedSeller = await this.sellerRepository.save(seller);

    this.logger.log(
      `Store status updated for user ${userId}: isOpen = ${updatedSeller.isOpen}`,
      'setStoreStatus',
    );

    return updatedSeller;
  }

  /**
   * Create a new work session (clock-in)
   * Called when seller opens their store
   * @param sellerId - The seller's ID
   */
  private async createWorkSession(sellerId: string): Promise<SellerSession> {
    const session = this.sessionRepository.create({
      sellerId,
      startTime: new Date(),
      endTime: null,
      totalDistanceKm: 0,
    });

    return await this.sessionRepository.save(session);
  }

  /**
   * Close the latest active work session (clock-out)
   * Called when seller closes their store
   * @param sellerId - The seller's ID
   */
  private async closeWorkSession(sellerId: string): Promise<void> {
    // Find the latest active session (where endTime is null)
    const activeSession = await this.sessionRepository.findOne({
      where: {
        sellerId,
        endTime: null as any,
      },
      order: {
        startTime: 'DESC',
      },
    });

    if (activeSession) {
      activeSession.endTime = new Date();
      await this.sessionRepository.save(activeSession);
      this.logger.log(
        `Work session closed for seller ${sellerId}. Duration: ${Math.round((activeSession.endTime.getTime() - activeSession.startTime.getTime()) / 1000 / 60)} minutes`,
        'closeWorkSession',
      );
    } else {
      this.logger.warn(
        `No active session found to close for seller ${sellerId}`,
        'closeWorkSession',
      );
    }
  }
}
