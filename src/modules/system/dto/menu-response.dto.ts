import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PermissionResponse } from './permission-response.dto';

/**
 * Menu Response DTO
 */
export class MenuResponse {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'menu.products' })
  code: string;

  @ApiProperty({ enum: ['MENU', 'BUTTON', 'TAB'] })
  type: 'MENU' | 'BUTTON' | 'TAB';

  @ApiProperty({ example: 'Products' })
  name: string;

  @ApiPropertyOptional()
  nameEn: string | null;

  @ApiPropertyOptional()
  icon: string | null;

  @ApiPropertyOptional()
  path: string | null;

  @ApiPropertyOptional()
  component: string | null;

  @ApiPropertyOptional()
  parentId: number | null;

  @ApiPropertyOptional()
  permissionId: number | null;

  @ApiProperty({ example: 0 })
  sortOrder: number;

  @ApiProperty({ example: true })
  isVisible: boolean;

  @ApiProperty({ example: true })
  isEnabled: boolean;

  @ApiPropertyOptional()
  description: string | null;

  @ApiPropertyOptional({ type: () => [MenuResponse] })
  children?: MenuResponse[];

  @ApiPropertyOptional({ type: () => PermissionResponse })
  permission?: PermissionResponse;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

