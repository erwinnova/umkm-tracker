import {
  IsString,
  IsNumber,
  IsPositive,
  IsUrl,
  IsOptional,
  IsBoolean,
  Length,
} from 'class-validator';

/**
 * DTO for updating a product
 * All fields are optional - only provided fields will be updated
 */
export class UpdateProductDto {
  /**
   * Product name
   * Optional, 1-255 characters
   */
  @IsString()
  @IsOptional()
  @Length(1, 255)
  name?: string;

  /**
   * Product price in currency units
   * Optional, must be positive number
   */
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @IsOptional()
  price?: number;

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
   * Optional, boolean only
   */
  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;
}
