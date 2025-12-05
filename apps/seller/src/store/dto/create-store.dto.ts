import {
  IsString,
  IsNotEmpty,
  IsOptional,
  Length,
  IsUrl,
} from 'class-validator';

/**
 * DTO for creating a new store profile
 * Used when a user onboards as a seller
 */
export class CreateStoreDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  storeName: string;

  @IsString()
  @IsOptional()
  @Length(0, 1000)
  description?: string;

  @IsString()
  @IsOptional()
  @Length(0, 100)
  category?: string;

  @IsOptional()
  @IsUrl()
  bannerUrl?: string;
}
