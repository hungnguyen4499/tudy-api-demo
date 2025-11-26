import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

/**
 * Create Permission Request DTO
 */
export class CreatePermissionRequest {
  @ApiProperty({ example: 'product.export' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'product' })
  @IsString()
  resource: string;

  @ApiProperty({ example: 'export' })
  @IsString()
  action: string;

  @ApiProperty({ example: 'Export Products' })
  @IsString()
  displayName: string;

  @ApiPropertyOptional({ example: 'Ability to export products' })
  @IsString()
  @IsOptional()
  description?: string;
}

