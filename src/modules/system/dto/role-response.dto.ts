import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PermissionResponse } from './permission-response.dto';
import { MenuResponse } from './menu-response.dto';

/**
 * Role Response DTO - List view
 */
export class RoleResponse {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'partner_admin' })
  name: string;

  @ApiProperty({ example: 'Partner Administrator' })
  displayName: string;

  @ApiPropertyOptional({ example: 'Full access for partner organization' })
  description: string | null;

  @ApiProperty({ example: false })
  isSystem: boolean;

  @ApiProperty({ example: 12 })
  permissionsCount: number;

  @ApiProperty({ example: 8 })
  menusCount: number;

  @ApiProperty({ example: 5 })
  usersCount: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

/**
 * Role Detail Response DTO
 */
export class RoleDetailResponse {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'partner_admin' })
  name: string;

  @ApiProperty({ example: 'Partner Administrator' })
  displayName: string;

  @ApiPropertyOptional({ example: 'Full access for partner organization' })
  description: string | null;

  @ApiProperty({ example: false })
  isSystem: boolean;

  @ApiProperty({ type: () => [PermissionResponse] })
  permissions: PermissionResponse[];

  @ApiProperty({ type: () => [MenuResponse] })
  menus: MenuResponse[];

  @ApiProperty({ type: () => [AssignedUserResponse] })
  assignedUsers: AssignedUserResponse[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

/**
 * Assigned User Response DTO
 */
export class AssignedUserResponse {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'John' })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  lastName: string;
}

