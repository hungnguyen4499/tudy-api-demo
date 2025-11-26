import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

/**
 * Update Menu Order Request DTO
 */
export class UpdateMenuOrderRequest {
  @ApiProperty({ example: 5 })
  @IsNumber()
  @Min(0)
  sortOrder: number;
}

