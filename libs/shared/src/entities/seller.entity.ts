import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Product } from './product.entity';
import { SellerSession } from './seller-session.entity';
import { SellerLocationLog } from './seller-location-log.entity';
import { SpatialPointTransformer, Point } from './spatial.transformer';

@Entity('sellers')
export class Seller {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Foreign Key - Explicit column for easier access
  @Column({ type: 'varchar', length: 36, name: 'user_id' })
  userId: string;

  @Column({ type: 'varchar', length: 255, name: 'store_name' })
  storeName: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  category: string | null;

  @Column({
    type: 'boolean',
    default: false,
    name: 'is_open',
  })
  isOpen: boolean;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'banner_url' })
  bannerUrl: string | null;

  /**
   * Spatial column for storing seller location (SRID 4326)
   * Stores latitude and longitude as a POINT geometry
   * MariaDB stores this as binary WKB format, transformer converts to/from Point object
   *
   * Note: Set select: false to prevent TypeORM from using spatial functions
   * during standard queries. Explicitly select when needed.
   */
  @Column({
    type: 'point',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
    name: 'last_location',
    transformer: new SpatialPointTransformer(),
    select: false, // Don't select by default to avoid AsText() errors
  })
  lastLocation: Point | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToOne(() => User, (user) => user.seller, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => Product, (product) => product.seller, {
    cascade: ['remove'],
  })
  products: Product[];

  @OneToMany(() => SellerSession, (session) => session.seller, {
    cascade: ['remove'],
  })
  sessions: SellerSession[];

  @OneToMany(() => SellerLocationLog, (log) => log.seller, {
    cascade: ['remove'],
  })
  locationLogs: SellerLocationLog[];
}

// Create spatial index on last_location for performance
@Index('idx_seller_last_location', ['lastLocation'], { spatial: true })
export class SellerWithSpatialIndex extends Seller {}
