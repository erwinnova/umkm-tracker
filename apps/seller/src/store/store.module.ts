import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product, Seller, User, SellerSession } from '@app/shared/entities';
import { StoreService } from './store.service';
import { StoreController } from './store.controller';

/**
 * Store Module
 * Manages store profile features for sellers including onboarding,
 * profile management, store status updates, and session tracking (clock-in/clock-out)
 */
@Module({
  imports: [TypeOrmModule.forFeature([Seller, User, Product, SellerSession])],
  providers: [StoreService],
  controllers: [StoreController],
  exports: [StoreService],
})
export class StoreModule {}
