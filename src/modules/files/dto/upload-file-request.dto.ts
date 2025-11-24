import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsIn } from 'class-validator';

/**
 * Upload File Request DTO
 * Metadata for file upload (file itself is handled by multipart/form-data)
 */
export class UploadFileRequest {
  @ApiProperty({
    description: 'Optional folder path where file will be stored',
    example: 'uploads',
    required: false,
  })
  @IsOptional()
  @IsString()
  folder?: string;

  @ApiProperty({
    description: 'Access control level for the file',
    enum: ['private', 'public-read', 'public-read-write'],
    example: 'public-read',
    required: false,
    default: 'public-read',
  })
  @IsOptional()
  @IsIn(['private', 'public-read', 'public-read-write'])
  acl?: 'private' | 'public-read' | 'public-read-write';
}

