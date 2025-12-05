import {
  WebSocketGateway,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
  WsException,
} from '@nestjs/websockets';
import { Logger, BadRequestException } from '@nestjs/common';
import { Socket } from 'socket.io';
import { TrackingService } from './tracking.service';

/**
 * Tracking Gateway
 * Handles real-time location tracking via WebSockets
 * Manages seller location updates and broadcasts them to connected clients
 *
 * WebSocket Namespace: /tracking
 * Events:
 *  - updateLocation: Receives location updates from connected sellers
 *  - connect: Seller connects to tracking system
 *  - disconnect: Seller disconnects from tracking system
 */
@WebSocketGateway({
  namespace: 'tracking',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: false,
  },
})
export class TrackingGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(TrackingGateway.name);

  // Track connected sellers: sellerId -> Socket
  private connectedSellers: Map<string, Socket> = new Map();

  constructor(private readonly trackingService: TrackingService) {}

  /**
   * Handle client connection
   * Called when a new WebSocket client connects to the tracking namespace
   *
   * @param client - The connected Socket.io client
   */
  handleConnection(client: Socket): void {
    this.logger.log(`Client connected: ${client.id}`, 'handleConnection');
    // Don't register the seller here - wait for authentication/registration
    // The client should emit an event to identify themselves
  }

  /**
   * Handle client disconnection
   * Called when a WebSocket client disconnects
   * Removes the seller from the connected map
   *
   * @param client - The disconnected Socket.io client
   */
  handleDisconnect(client: Socket): void {
    // Find and remove the seller from connected map
    for (const [sellerId, socket] of this.connectedSellers.entries()) {
      if (socket.id === client.id) {
        this.connectedSellers.delete(sellerId);
        this.logger.log(
          `Seller ${sellerId} disconnected. Socket: ${client.id}`,
          'handleDisconnect',
        );
        break;
      }
    }
  }

  /**
   * Register a seller when they connect
   * Called when seller sends 'register' event with their ID
   * Allows mapping sellerId to their Socket connection
   *
   * @param client - The Socket.io client
   * @param payload - { sellerId: string }
   * @returns Acknowledgment object
   */
  @SubscribeMessage('register')
  handleRegister(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { sellerId: string },
  ): { status: string; sellerId: string } {
    const { sellerId } = payload;

    if (!sellerId || typeof sellerId !== 'string') {
      throw new WsException('Invalid sellerId');
    }

    // Remove previous connection if seller was already connected
    const existingSocket = this.connectedSellers.get(sellerId);
    if (existingSocket) {
      existingSocket.disconnect();
      this.logger.log(
        `Seller ${sellerId} reconnected. Closed previous connection.`,
        'handleRegister',
      );
    }

    // Register the new connection
    this.connectedSellers.set(sellerId, client);
    this.logger.log(
      `Seller registered: ${sellerId}. Socket: ${client.id}`,
      'handleRegister',
    );

    return {
      status: 'registered',
      sellerId,
    };
  }

  /**
   * Handle location update from seller
   * Receives real-time location data and processes it
   * Updates database through TrackingService
   *
   * Event: updateLocation
   * Payload: { sellerId: string, lat: number, lng: number, sessionId?: string }
   * Response: { status: 'ok' | 'skipped', message: string }
   *
   * @param client - The Socket.io client sending the update
   * @param payload - Location update payload
   * @returns Acknowledgment with status
   */
  @SubscribeMessage('updateLocation')
  async handleUpdateLocation(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: {
      sellerId: string;
      lat: number;
      lng: number;
      sessionId?: string;
    },
  ): Promise<{
    status: 'ok' | 'skipped' | 'error';
    message: string;
    data?: any;
  }> {
    try {
      const { sellerId, lat, lng, sessionId } = payload;

      // Validate payload
      if (!sellerId || typeof sellerId !== 'string') {
        throw new WsException('Invalid sellerId');
      }

      if (lat === undefined || lng === undefined) {
        throw new WsException('Missing latitude or longitude');
      }

      if (typeof lat !== 'number' || typeof lng !== 'number') {
        throw new WsException('Latitude and longitude must be numbers');
      }

      this.logger.debug(
        `Location update received from seller ${sellerId}: [${lat}, ${lng}]`,
        'handleUpdateLocation',
      );

      // Call TrackingService to log location
      const result = await this.trackingService.logLocationHistory(
        sellerId,
        lat,
        lng,
        sessionId,
      );

      if (result) {
        // Location was logged
        this.logger.debug(
          `Location logged for seller ${sellerId}`,
          'handleUpdateLocation',
        );

        // Broadcast location update to other clients (optional)
        // Could be used for real-time map display of all sellers
        client.broadcast.emit('sellerLocationUpdate', {
          sellerId,
          lat,
          lng,
          timestamp: new Date(),
        });

        return {
          status: 'ok',
          message: 'Location logged successfully',
          data: {
            sellerId,
            lat,
            lng,
            timestamp: result.recordedAt,
          },
        };
      } else {
        // Location was skipped by optimization
        this.logger.debug(
          `Location update skipped for seller ${sellerId} (optimization)`,
          'handleUpdateLocation',
        );

        return {
          status: 'skipped',
          message: 'Location update skipped (within optimization threshold)',
          data: { sellerId, lat, lng },
        };
      }
    } catch (error) {
      this.logger.error(
        `Error handling location update: ${error.message}`,
        error.stack,
        'handleUpdateLocation',
      );

      if (error instanceof BadRequestException) {
        throw new WsException(error.message);
      }

      throw new WsException('Failed to process location update');
    }
  }

  /**
   * Heartbeat/ping handler
   * Allows clients to send periodic pings to keep connection alive
   * Useful for detecting stale connections
   *
   * Event: ping
   * Response: { status: 'pong', timestamp: number }
   *
   * @param client - The Socket.io client
   * @returns Pong acknowledgment with timestamp
   */
  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket): {
    status: string;
    timestamp: number;
  } {
    return {
      status: 'pong',
      timestamp: Date.now(),
    };
  }

  /**
   * Broadcast location update to all connected clients
   * Used internally to notify all clients of a seller's location update
   * Could be used for real-time maps showing all active sellers
   *
   * @param sellerId - The seller's ID
   * @param lat - Latitude
   * @param lng - Longitude
   */
  broadcastLocationUpdate(sellerId: string, lat: number, lng: number): void {
    // Broadcast to all connected clients
    for (const socket of this.connectedSellers.values()) {
      socket.emit('sellerLocationUpdate', {
        sellerId,
        lat,
        lng,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Get list of currently connected sellers
   * Useful for debugging or admin dashboards
   *
   * @returns Array of connected seller IDs
   */
  getConnectedSellers(): string[] {
    return Array.from(this.connectedSellers.keys());
  }

  /**
   * Get count of connected sellers
   * @returns Number of connected sellers
   */
  getConnectedCount(): number {
    return this.connectedSellers.size;
  }
}
