import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

/**
 * Update Menu Visibility Request DTO
 */
export class UpdateMenuVisibilityRequest {
  @ApiProperty({ example: true })
  @IsBoolean()
  isVisible: boolean;
}

