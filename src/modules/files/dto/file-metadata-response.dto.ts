import { ApiProperty } from '@nestjs/swagger';

/**
 * File Metadata Response
 */
export class FileMetadataResponse {
  @ApiProperty({
    description: 'File key (path) in storage',
    example: 'uploads/1234567890-document.pdf',
  })
  key: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 1024000,
  })
  size: number;

  @ApiProperty({
    description: 'MIME type of the file',
    example: 'application/pdf',
    required: false,
  })
  contentType?: string;

  @ApiProperty({
    description: 'Last modified date',
    example: '2024-01-01T00:00:00.000Z',
    required: false,
  })
  lastModified?: Date;

  @ApiProperty({
    description: 'ETag of the file',
    example: 'd41d8cd98f00b204e9800998ecf8427e',
    required: false,
  })
  etag?: string;
}

