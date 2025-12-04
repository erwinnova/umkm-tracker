import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Seller } from './seller.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Foreign Key - Explicit column for easier access
  @Column({ type: 'varchar', length: 36, name: 'seller_id' })
  sellerId: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  /**
   * Price stored as DECIMAL(10,2) for precise currency handling
   * Precision: 10 total digits
   * Scale: 2 decimal places (e.g., 99999999.99)
   */
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: {
      to: (value: number | string | null | undefined) => value,
      from: (value: string | null) => (value ? parseFloat(value) : null),
    },
  })
  price: number;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'image_url' })
  imageUrl: string | null;

  @Column({
    type: 'boolean',
    default: true,
    name: 'is_available',
  })
  isAvailable: boolean;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Seller, (seller) => seller.products, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'seller_id' })
  seller: Seller;
}

// Create indexes for common queries
@Index('idx_product_seller_id', ['sellerId'])
@Index('idx_product_is_available', ['isAvailable'])
@Index('idx_product_created_at', ['createdAt'])
export class ProductWithIndexes extends Product {}
