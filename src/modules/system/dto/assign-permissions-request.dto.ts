import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber } from 'class-validator';

/**
 * Assign Permissions Request DTO
 */
export class AssignPermissionsRequest {
  @ApiProperty({ example: [1, 2, 3], description: 'Array of permission IDs' })
  @IsArray()
  @IsNumber({}, { each: true })
  permissionIds: number[];
}

