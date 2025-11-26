import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString } from 'class-validator';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { UserStatus } from '@/common/constants';

export class UsersQuery extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by role name (e.g., "parent", "partner_admin")' })
  @IsOptional()
  @IsString()
  role?: string; // Role name from Role table, not enum

  @ApiPropertyOptional({ description: 'Filter by status', enum: UserStatus })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({ description: 'Search by email or name' })
  @IsOptional()
  @IsString()
  search?: string;
}
