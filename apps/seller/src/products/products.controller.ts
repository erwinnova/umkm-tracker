import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto } from './dto';
import { Product } from '@app/shared/entities';

/**
 * Products Controller
 * Handles HTTP requests for product management
 * All endpoints are protected with JWT authentication
 * Users can only manage their own seller's products
 */
@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /**
   * POST /products
   * Create a new product for the authenticated seller
   * @param req - Express request with authenticated user info
   * @param dto - Create product data
   * @returns The created product (HTTP 201)
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Req() req: any,
    @Body() dto: CreateProductDto,
  ): Promise<Product> {
    const userId = req.user.id;
    return this.productsService.create(userId, dto);
  }

  /**
   * GET /products
   * Get all products for the authenticated seller
   * Ordered by availability (DESC) then name (ASC)
   * @param req - Express request with authenticated user info
   * @returns Array of products (HTTP 200)
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@Req() req: any): Promise<Product[]> {
    const userId = req.user.id;
    return this.productsService.findAll(userId);
  }

  /**
   * GET /products/:id
   * Get a specific product by ID (with ownership validation)
   * @param req - Express request with authenticated user info
   * @param id - The product ID
   * @returns The product (HTTP 200)
   * @throws NotFoundException if product not found or not owned
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Req() req: any, @Param('id') id: string): Promise<Product> {
    const userId = req.user.id;
    return this.productsService.findOne(id, userId);
  }

  /**
   * PATCH /products/:id
   * Update a product (with ownership validation)
   * Only provided fields are updated
   * @param req - Express request with authenticated user info
   * @param id - The product ID
   * @param dto - Updated product data
   * @returns The updated product (HTTP 200)
   * @throws NotFoundException if product not found or not owned
   */
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ): Promise<Product> {
    const userId = req.user.id;
    return this.productsService.update(id, userId, dto);
  }

  /**
   * DELETE /products/:id
   * Delete a product (with ownership validation)
   * @param req - Express request with authenticated user info
   * @param id - The product ID
   * @returns Empty response (HTTP 204)
   * @throws NotFoundException if product not found or not owned
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Req() req: any, @Param('id') id: string): Promise<void> {
    const userId = req.user.id;
    return this.productsService.remove(id, userId);
  }
}
