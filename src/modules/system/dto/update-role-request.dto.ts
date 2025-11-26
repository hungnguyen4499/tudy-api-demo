import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional } from 'class-validator';
import { DataScopeType } from '@/common/constants';

/**
 * Update Role Request DTO
 */
export class UpdateRoleRequest {
  @ApiPropertyOptional({ example: 'Partner Manager' })
  @IsString()
  @IsOptional()
  displayName?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    enum: DataScopeType,
    description: 'What data can users with this role access?',
  })
  @IsEnum(DataScopeType)
  @IsOptional()
  dataScope?: DataScopeType;
}

