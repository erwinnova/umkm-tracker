import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product, Seller } from '@app/shared/entities';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';

/**
 * Products Module
 * Manages product CRUD operations for sellers
 * Features:
 *  - Create, read, update, delete products
 *  - Ownership validation (users can only manage their own products)
 *  - Product filtering and sorting
 *  - Availability status management
 */
@Module({
  imports: [TypeOrmModule.forFeature([Product, Seller])],
  providers: [ProductsService],
  controllers: [ProductsController],
  exports: [ProductsService],
})
export class ProductsModule {}
