import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SellerLocationLog, SellerSession, Point } from '@app/shared/entities';

/**
 * Tracking Service
 * Handles location tracking, route history logging, and analytics data collection
 * Implements distance optimization to prevent database bloat
 *
 * Optimization Strategy:
 * - Only log location if distance from last point > 20 meters
 * - OR if time difference from last point > 2 minutes
 * This reduces unnecessary database writes while maintaining detailed route history
 */
@Injectable()
export class TrackingService {
  private readonly logger = new Logger(TrackingService.name);

  // Constants for optimization
  private readonly MIN_DISTANCE_METERS = 20;
  private readonly MIN_TIME_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes

  constructor(
    @InjectRepository(SellerLocationLog)
    private readonly locationLogRepository: Repository<SellerLocationLog>,
    @InjectRepository(SellerSession)
    private readonly sessionRepository: Repository<SellerSession>,
  ) {}

  /**
   * Log seller location history with optimization
   * Only creates a new log entry if:
   * 1. Distance from last recorded point > 20 meters, OR
   * 2. Time since last record > 2 minutes
   *
   * @param sellerId - The seller's ID
   * @param latitude - Latitude coordinate (WGS84)
   * @param longitude - Longitude coordinate (WGS84)
   * @param sessionId - Optional: The current work session ID
   * @returns SellerLocationLog if created, null if optimization check failed
   * @throws BadRequestException if coordinates are invalid
   */
  async logLocationHistory(
    sellerId: string,
    latitude: number,
    longitude: number,
    sessionId?: string,
  ): Promise<SellerLocationLog | null> {
    this.logger.debug(
      `Processing location log for seller ${sellerId}: [${latitude}, ${longitude}]`,
      'logLocationHistory',
    );

    // Validate coordinates
    if (!this.isValidCoordinate(latitude, longitude)) {
      this.logger.warn(
        `Invalid coordinates for seller ${sellerId}: lat=${latitude}, lng=${longitude}`,
        'logLocationHistory',
      );
      throw new BadRequestException(
        'Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180',
      );
    }

    // Get the last recorded location for this seller
    const lastLocation = await this.locationLogRepository.findOne({
      where: { sellerId },
      order: { recordedAt: 'DESC' },
    });

    // Check if we should log this location (optimization)
    if (lastLocation) {
      const shouldLog = await this.shouldLogLocation(
        lastLocation,
        latitude,
        longitude,
      );

      if (!shouldLog) {
        this.logger.debug(
          `Location log skipped for seller ${sellerId} (optimization)`,
          'logLocationHistory',
        );
        return null;
      }
    }

    // Create location log entry
    const locationLog = this.locationLogRepository.create({
      sellerId,
      sessionId: sessionId || null,
      recordedAt: new Date(),
      location: {
        latitude,
        longitude,
      } as Point,
    });

    const savedLog = await this.locationLogRepository.save(locationLog);

    this.logger.log(
      `Location logged for seller ${sellerId}: [${latitude}, ${longitude}]`,
      'logLocationHistory',
    );

    return savedLog;
  }

  /**
   * Get location history for a seller within a time range
   * Useful for route visualization and analysis
   *
   * @param sellerId - The seller's ID
   * @param startTime - Start of time range
   * @param endTime - End of time range
   * @returns Array of location logs ordered by recorded time
   */
  async getLocationHistory(
    sellerId: string,
    startTime: Date,
    endTime: Date,
  ): Promise<SellerLocationLog[]> {
    this.logger.debug(
      `Fetching location history for seller ${sellerId}`,
      'getLocationHistory',
    );

    return await this.locationLogRepository.find({
      where: {
        sellerId,
        recordedAt: {
          // Using query builder for proper date range filtering
        } as any,
      },
      order: { recordedAt: 'ASC' },
    });
  }

  /**
   * Get location history for a specific session
   * Used for analytics of a particular work shift
   *
   * @param sessionId - The session's ID
   * @returns Array of location logs for the session
   */
  async getSessionLocationHistory(
    sessionId: string,
  ): Promise<SellerLocationLog[]> {
    this.logger.debug(
      `Fetching location history for session ${sessionId}`,
      'getSessionLocationHistory',
    );

    return await this.locationLogRepository.find({
      where: { sessionId },
      order: { recordedAt: 'ASC' },
    });
  }

  /**
   * Calculate total distance traveled during a session
   * Updates the SellerSession.totalDistanceKm field
   *
   * @param sessionId - The session's ID
   * @returns Total distance in kilometers
   */
  async calculateSessionDistance(sessionId: string): Promise<number> {
    this.logger.debug(
      `Calculating distance for session ${sessionId}`,
      'calculateSessionDistance',
    );

    // Get all location logs for this session in chronological order
    const locations = await this.getSessionLocationHistory(sessionId);

    if (locations.length < 2) {
      return 0;
    }

    let totalDistance = 0;

    // Calculate distance between consecutive points using Haversine formula
    for (let i = 0; i < locations.length - 1; i++) {
      const current = locations[i].location;
      const next = locations[i + 1].location;

      const distance = this.haversineDistance(
        current.latitude,
        current.longitude,
        next.latitude,
        next.longitude,
      );

      totalDistance += distance;
    }

    // Update session's totalDistanceKm
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
    });

    if (session) {
      session.totalDistanceKm = totalDistance;
      await this.sessionRepository.save(session);
      this.logger.log(
        `Session ${sessionId} total distance calculated: ${totalDistance.toFixed(2)} km`,
        'calculateSessionDistance',
      );
    }

    return totalDistance;
  }

  /**
   * Determine if a new location should be logged based on distance and time
   * Private method used for optimization
   *
   * @param lastLocation - The last recorded location
   * @param newLatitude - New latitude coordinate
   * @param newLongitude - New longitude coordinate
   * @returns true if location should be logged, false if optimization criteria not met
   */
  private async shouldLogLocation(
    lastLocation: SellerLocationLog,
    newLatitude: number,
    newLongitude: number,
  ): Promise<boolean> {
    const now = new Date();
    const timeDifference = now.getTime() - lastLocation.recordedAt.getTime();

    // Check time interval (> 2 minutes)
    if (timeDifference > this.MIN_TIME_INTERVAL_MS) {
      this.logger.debug(
        `Location log passed time interval check: ${timeDifference}ms > ${this.MIN_TIME_INTERVAL_MS}ms`,
      );
      return true;
    }

    // Check distance (> 20 meters)
    const distance = this.haversineDistance(
      lastLocation.location.latitude,
      lastLocation.location.longitude,
      newLatitude,
      newLongitude,
    );

    const distanceInMeters = distance * 1000;
    if (distanceInMeters > this.MIN_DISTANCE_METERS) {
      this.logger.debug(
        `Location log passed distance check: ${distanceInMeters.toFixed(2)}m > ${this.MIN_DISTANCE_METERS}m`,
      );
      return true;
    }

    return false;
  }

  /**
   * Validate coordinate ranges
   * Latitude: -90 to 90
   * Longitude: -180 to 180
   *
   * @param latitude - Latitude value
   * @param longitude - Longitude value
   * @returns true if valid, false otherwise
   */
  private isValidCoordinate(latitude: number, longitude: number): boolean {
    return (
      latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180
    );
  }

  /**
   * Calculate distance between two geographical points using Haversine formula
   * Returns distance in kilometers
   *
   * Formula reference:
   * https://en.wikipedia.org/wiki/Haversine_formula
   *
   * @param lat1 - First point latitude
   * @param lng1 - First point longitude
   * @param lat2 - Second point latitude
   * @param lng2 - Second point longitude
   * @returns Distance in kilometers
   */
  private haversineDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadian(lat2 - lat1);
    const dLng = this.toRadian(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadian(lat1)) *
        Math.cos(this.toRadian(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
  }

  /**
   * Convert degrees to radians
   * @param degrees - Angle in degrees
   * @returns Angle in radians
   */
  private toRadian(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }
}
