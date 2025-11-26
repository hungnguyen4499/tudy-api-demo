import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ScopeType } from '@prisma/client';

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
    enum: ['GLOBAL', 'ORGANIZATION', 'USER'],
    example: 'ORGANIZATION',
    description: 'What data can users with this role access?',
  })
  @IsEnum(ScopeType)
  dataScope: ScopeType;
}

