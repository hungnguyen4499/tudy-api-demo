import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ScopeType } from '@prisma/client';

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
    enum: ['GLOBAL', 'ORGANIZATION', 'USER'],
    description: 'What data can users with this role access?',
  })
  @IsEnum(ScopeType)
  @IsOptional()
  dataScope?: ScopeType;
}

