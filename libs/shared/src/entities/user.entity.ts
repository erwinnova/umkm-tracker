import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
} from 'typeorm';
import { Seller } from './seller.entity';

export enum UserRole {
  ADMIN = 'ADMIN',
  SELLER = 'SELLER',
  BUYER = 'BUYER',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 255, select: false })
  password: string;

  @Column({ type: 'varchar', length: 255, name: 'full_name' })
  fullName: string;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'phone_number' })
  phoneNumber: string | null;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.BUYER,
  })
  role: UserRole;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToOne(() => Seller, (seller) => seller.user, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  seller: Seller | null;
}
