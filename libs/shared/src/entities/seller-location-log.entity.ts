import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Seller } from './seller.entity';
import { SellerSession } from './seller-session.entity';
import { SpatialPointTransformer, Point } from './spatial.transformer';

/**
 * SellerLocationLog Entity
 * Represents historical location breadcrumbs/route of a seller
 * Used for route analysis, distance calculation, and AI prediction models
 *
 * Spatial Indexing:
 * - SPATIAL index on location column for efficient range queries
 * - Composite indexes on (sellerId, recordedAt) for time-series queries
 * - Composite indexes on (sessionId, recordedAt) for session-based queries
 */
@Entity('seller_location_logs')
@Index('idx_seller_id_recorded_at', ['sellerId', 'recordedAt'])
@Index('idx_session_id_recorded_at', ['sessionId', 'recordedAt'], {
  where: 'session_id IS NOT NULL',
})
export class SellerLocationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Foreign Key to Seller
   * Explicit column for easier access and querying
   */
  @Column({ type: 'varchar', length: 36, name: 'seller_id' })
  sellerId: string;

  /**
   * Foreign Key to SellerSession
   * Links location log to a specific work session
   * NULL if recorded outside of any session
   */
  @Column({
    type: 'varchar',
    length: 36,
    nullable: true,
    name: 'session_id',
    comment: 'Reference to work session (null if outside session)',
  })
  sessionId: string | null;

  /**
   * Timestamp when location was recorded
   * Precision for efficient range queries
   */
  @Column({
    type: 'datetime',
    name: 'recorded_at',
    comment: 'Timestamp of location record',
  })
  recordedAt: Date;

  /**
   * Spatial POINT column storing seller location (SRID 4326 - WGS84)
   * SRID 4326: World Geodetic System 1984 (standard GPS coordinates)
   * Longitude range: -180 to 180
   * Latitude range: -90 to 90
   *
   * Transformer: Handles MariaDB binary WKB format conversion
   * Database stores as binary geometry, application works with Point object
   *
   * Note: select: false to prevent TypeORM from applying spatial functions
   * during queries that would cause "AsText does not exist" errors
   */
  @Column({
    type: 'point',
    spatialFeatureType: 'Point',
    srid: 4326,
    name: 'location',
    transformer: new SpatialPointTransformer(),
    comment: 'Geographic location (SRID 4326 - WGS84)',
    select: false, // Don't select by default to avoid AsText() errors
  })
  location: Point;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  /**
   * Many-to-One relation with Seller
   * Each location log belongs to exactly one seller
   */
  @ManyToOne(() => Seller, (seller) => seller.locationLogs, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'seller_id' })
  seller: Seller;

  /**
   * Many-to-One relation with SellerSession
   * Optional: location log can exist without a session reference
   * Useful for tracking movements outside of active sessions
   */
  @ManyToOne(() => SellerSession, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'session_id' })
  session: SellerSession | null;
}
