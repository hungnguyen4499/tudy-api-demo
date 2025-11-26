import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsNumber, IsBoolean, Min } from 'class-validator';

/**
 * Create Menu Request DTO
 */
export class CreateMenuRequest {
  @ApiProperty({ example: 'menu.reports' })
  @IsString()
  code: string;

  @ApiProperty({ enum: ['MENU', 'BUTTON', 'TAB'], example: 'MENU' })
  @IsEnum(['MENU', 'BUTTON', 'TAB'])
  type: 'MENU' | 'BUTTON' | 'TAB';

  @ApiProperty({ example: 'Reports' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'ChartBarIcon' })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional({ example: '/reports' })
  @IsString()
  @IsOptional()
  path?: string;

  @ApiPropertyOptional({ example: 'ReportsPage' })
  @IsString()
  @IsOptional()
  component?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsNumber()
  @IsOptional()
  parentId?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsNumber()
  @IsOptional()
  permissionId?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isVisible?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;

  @ApiPropertyOptional({ example: 'Reports and analytics' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: { someKey: 'someValue' } })
  @IsOptional()
  metadata?: any;
}

