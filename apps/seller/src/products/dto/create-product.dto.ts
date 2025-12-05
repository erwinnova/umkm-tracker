import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsUrl,
  IsOptional,
  IsBoolean,
  Length,
} from 'class-validator';

/**
 * DTO for creating a new product
 * Validated with class-validator decorators
 */
export class CreateProductDto {
  /**
   * Product name
   * Required, 1-255 characters
   */
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  name: string;

  /**
   * Product price in currency units
   * Required, must be positive number
   * Stored as DECIMAL(10,2) in database
   */
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  price: number;

  /**
   * Product description
   * Optional, max 1000 characters
   */
  @IsString()
  @IsOptional()
  @Length(0, 1000)
  description?: string;

  /**
   * Product image URL
   * Optional, must be valid URL
   */
  @IsUrl()
  @IsOptional()
  imageUrl?: string;

  /**
   * Product availability status
   * Optional, defaults to true if not provided
   */
  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;
}
