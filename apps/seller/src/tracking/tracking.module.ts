import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Seller, SellerLocationLog, SellerSession } from '@app/shared/entities';
import { TrackingService } from './tracking.service';
import { TrackingGateway } from './tracking.gateway';

/**
 * Tracking Module
 * Manages seller location tracking via WebSockets
 * Handles real-time location updates, route history logging, and analytics
 * Features:
 *  - WebSocket gateway for real-time location streaming
 *  - Location logging with distance optimization (20m threshold, 2min interval)
 *  - Session-based route tracking
 *  - Seller connection management
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Seller, SellerLocationLog, SellerSession]),
  ],
  providers: [TrackingService, TrackingGateway],
  exports: [TrackingService, TrackingGateway],
})
export class TrackingModule {}
