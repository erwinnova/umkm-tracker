import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product, Seller } from '@app/shared/entities';
import { CreateProductDto, UpdateProductDto } from './dto';

/**
 * Products Service
 * Manages product CRUD operations with strict ownership validation
 * Users can only manage products that belong to their seller profile
 */
@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Seller)
    private readonly sellerRepository: Repository<Seller>,
  ) {}

  /**
   * Helper method to get seller ID from user ID
   * Validates that the user is a registered seller
   *
   * @param userId - The authenticated user's ID
   * @returns The seller's ID
   * @throws NotFoundException if user is not a registered seller
   */
  private async getSellerId(userId: string): Promise<string> {
    this.logger.debug(`Getting seller ID for user: ${userId}`, 'getSellerId');

    const seller = await this.sellerRepository.findOne({
      where: { userId },
    });

    if (!seller) {
      this.logger.warn(
        `User ${userId} attempted to access products but is not a registered seller`,
        'getSellerId',
      );
      throw new NotFoundException(
        'You must create a seller profile first before managing products',
      );
    }

    return seller.id;
  }

  /**
   * Create a new product for the authenticated seller
   * @param userId - The authenticated user's ID
   * @param dto - Create product data
   * @returns The created product
   */
  async create(userId: string, dto: CreateProductDto): Promise<Product> {
    this.logger.debug(`Creating product for user: ${userId}`, 'create');

    // Get seller ID and validate ownership
    const sellerId = await this.getSellerId(userId);

    // Create product entity
    const product = this.productRepository.create({
      sellerId,
      name: dto.name,
      price: dto.price,
      description: dto.description || null,
      imageUrl: dto.imageUrl || null,
      isAvailable: dto.isAvailable ?? true, // Default to true
    });

    const createdProduct = await this.productRepository.save(product);
    this.logger.log(
      `Product created successfully for seller ${sellerId}: ${createdProduct.id}`,
      'create',
    );

    return createdProduct;
  }

  /**
   * Get all products for the authenticated seller
   * Ordered by availability (DESC) then name (ASC)
   *
   * @param userId - The authenticated user's ID
   * @returns Array of products
   */
  async findAll(userId: string): Promise<Product[]> {
    this.logger.debug(`Fetching all products for user: ${userId}`, 'findAll');

    // Get seller ID and validate ownership
    const sellerId = await this.getSellerId(userId);

    const products = await this.productRepository.find({
      where: { sellerId },
      order: {
        isAvailable: 'DESC',
        name: 'ASC',
      },
    });

    this.logger.log(
      `Retrieved ${products.length} products for seller ${sellerId}`,
      'findAll',
    );

    return products;
  }

  /**
   * Get a single product by ID with ownership validation
   * @param id - The product ID
   * @param userId - The authenticated user's ID
   * @returns The product
   * @throws NotFoundException if product not found or user doesn't own it
   */
  async findOne(id: string, userId: string): Promise<Product> {
    this.logger.debug(`Fetching product: ${id} for user: ${userId}`, 'findOne');

    // Get seller ID and validate ownership
    const sellerId = await this.getSellerId(userId);

    // Find product with ownership check
    const product = await this.productRepository.findOne({
      where: { id, sellerId },
    });

    if (!product) {
      this.logger.warn(
        `Product ${id} not found or not owned by seller ${sellerId}`,
        'findOne',
      );
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  /**
   * Update a product with ownership validation
   * Only updates fields that are provided in the DTO
   *
   * @param id - The product ID
   * @param userId - The authenticated user's ID
   * @param dto - Updated product data
   * @returns The updated product
   * @throws NotFoundException if product not found or user doesn't own it
   */
  async update(
    id: string,
    userId: string,
    dto: UpdateProductDto,
  ): Promise<Product> {
    this.logger.debug(`Updating product: ${id} for user: ${userId}`, 'update');

    // Get the product with ownership check
    const product = await this.findOne(id, userId);

    // Merge updates - only update provided fields
    const updatedProduct = this.productRepository.merge(product, {
      name: dto.name !== undefined ? dto.name : product.name,
      price: dto.price !== undefined ? dto.price : product.price,
      description:
        dto.description !== undefined ? dto.description : product.description,
      imageUrl: dto.imageUrl !== undefined ? dto.imageUrl : product.imageUrl,
      isAvailable:
        dto.isAvailable !== undefined ? dto.isAvailable : product.isAvailable,
    });

    const saved = await this.productRepository.save(updatedProduct);
    this.logger.log(`Product ${id} updated successfully`, 'update');

    return saved;
  }

  /**
   * Delete a product with ownership validation
   * @param id - The product ID
   * @param userId - The authenticated user's ID
   * @throws NotFoundException if product not found or user doesn't own it
   */
  async remove(id: string, userId: string): Promise<void> {
    this.logger.debug(`Deleting product: ${id} for user: ${userId}`, 'remove');

    // Get the product with ownership check
    const product = await this.findOne(id, userId);

    // Delete the product
    await this.productRepository.remove(product);
    this.logger.log(`Product ${id} deleted successfully`, 'remove');
  }
}
