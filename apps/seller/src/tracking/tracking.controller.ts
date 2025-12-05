import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Req,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TrackingService } from './tracking.service';

/**
 * Tracking Controller
 * Handles HTTP requests for seller location tracking and route history
 * All endpoints are protected with JWT authentication
 */
@Controller('seller/tracking')
@UseGuards(JwtAuthGuard)
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  /**
   * POST /seller/tracking/location
   * Log a seller's current location
   * Uses optimization to prevent database bloat (20m distance or 2min interval)
   *
   * @param req - Express request with authenticated user info
   * @param body - Location data with latitude, longitude, and optional sessionId
   * @returns SellerLocationLog if created, or null if optimization skipped
   */
  @Post('location')
  @HttpCode(HttpStatus.CREATED)
  async logLocation(
    @Req() req: any,
    @Body()
    body: {
      latitude: number;
      longitude: number;
      sessionId?: string;
    },
  ) {
    const { latitude, longitude, sessionId } = body;

    if (latitude === undefined || longitude === undefined) {
      throw new BadRequestException('Latitude and longitude are required');
    }

    const result = await this.trackingService.logLocationHistory(
      req.user.id,
      latitude,
      longitude,
      sessionId,
    );

    if (result) {
      return {
        success: true,
        message: 'Location logged successfully',
        data: result,
      };
    } else {
      return {
        success: true,
        message: 'Location update skipped (optimization)',
        data: null,
      };
    }
  }

  /**
   * GET /seller/tracking/session/:sessionId
   * Get location history for a specific work session
   *
   * @param sessionId - The session ID
   * @returns Array of location logs for the session
   */
  @Get('session/:sessionId')
  @HttpCode(HttpStatus.OK)
  async getSessionHistory(@Param('sessionId') sessionId: string) {
    const locations =
      await this.trackingService.getSessionLocationHistory(sessionId);

    return {
      success: true,
      sessionId,
      locationCount: locations.length,
      data: locations,
    };
  }

  /**
   * GET /seller/tracking/session/:sessionId/distance
   * Calculate total distance traveled during a session
   *
   * @param sessionId - The session ID
   * @returns Total distance in kilometers
   */
  @Get('session/:sessionId/distance')
  @HttpCode(HttpStatus.OK)
  async calculateDistance(@Param('sessionId') sessionId: string) {
    const distance =
      await this.trackingService.calculateSessionDistance(sessionId);

    return {
      success: true,
      sessionId,
      totalDistanceKm: distance.toFixed(2),
    };
  }
}
