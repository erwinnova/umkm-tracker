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

/**
 * SellerSession Entity
 * Represents a work shift/session for a seller
 * Tracks when the seller started working (clock-in) and when they stopped (clock-out)
 * Used for analytics and AI prediction models
 */
@Entity('seller_sessions')
@Index('idx_seller_id_end_time', ['sellerId', 'endTime'])
@Index('idx_seller_id_start_time', ['sellerId', 'startTime'])
export class SellerSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Foreign Key to Seller
   * Explicit column for easier access and querying
   */
  @Column({ type: 'varchar', length: 36, name: 'seller_id' })
  sellerId: string;

  /**
   * Session start time (clock-in)
   * Timestamp when seller started their work shift
   */
  @Column({
    type: 'datetime',
    name: 'start_time',
    comment: 'Clock-in timestamp',
  })
  startTime: Date;

  /**
   * Session end time (clock-out)
   * Timestamp when seller ended their work shift
   * NULL if session is still active
   */
  @Column({
    type: 'datetime',
    nullable: true,
    name: 'end_time',
    comment: 'Clock-out timestamp (null for active sessions)',
  })
  endTime: Date | null;

  /**
   * Total distance traveled during this session in kilometers
   * Calculated from seller location logs within this session
   * Used for analytics and seller performance tracking
   */
  @Column({
    type: 'float',
    default: 0,
    name: 'total_distance_km',
    comment: 'Total distance traveled in km during session',
  })
  totalDistanceKm: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  /**
   * Many-to-One relation with Seller
   * Each session belongs to exactly one seller
   */
  @ManyToOne(() => Seller, (seller) => seller.sessions, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'seller_id' })
  seller: Seller;
}
