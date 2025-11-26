import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Permission Response DTO
 */
export class PermissionResponse {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'product.create' })
  code: string;

  @ApiProperty({ example: 'product' })
  resource: string;

  @ApiProperty({ example: 'create' })
  action: string;

  @ApiProperty({ example: 'Create Product' })
  displayName: string;

  @ApiPropertyOptional({ example: 'Ability to create new products' })
  description: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

/**
 * Permission Group Response DTO
 */
export class PermissionGroupResponse {
  @ApiProperty({ example: 'product' })
  resource: string;

  @ApiProperty({ type: () => [PermissionResponse] })
  permissions: PermissionResponse[];

  @ApiProperty({ example: 4 })
  count: number;
}

