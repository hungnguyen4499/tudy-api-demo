import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber } from 'class-validator';

/**
 * Assign Menus Request DTO
 */
export class AssignMenusRequest {
  @ApiProperty({ example: [1, 2, 3], description: 'Array of menu IDs' })
  @IsArray()
  @IsNumber({}, { each: true })
  menuIds: number[];
}

