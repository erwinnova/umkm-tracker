import { IsBoolean } from 'class-validator';

/**
 * DTO for updating store status
 * Used to open/close a store
 */
export class UpdateStoreStatusDto {
  @IsBoolean()
  isOpen: boolean;
}
