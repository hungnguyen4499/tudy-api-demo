import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional } from 'class-validator';
import { DataScopeType } from '@/common/constants';

/**
 * Create Role Request DTO
 */
export class CreateRoleRequest {
  @ApiProperty({ example: 'partner_manager' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Partner Manager' })
  @IsString()
  displayName: string;

  @ApiPropertyOptional({ example: 'Manager role for partner organization' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    enum: DataScopeType,
    example: DataScopeType.ORGANIZATION,
    description: 'What data can users with this role access?',
  })
  @IsEnum(DataScopeType)
  dataScope: DataScopeType;
}

