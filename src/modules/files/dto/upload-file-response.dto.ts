import { ApiProperty } from '@nestjs/swagger';

/**
 * Upload File Response
 */
export class UploadFileResponse {
  @ApiProperty({
    description: 'File key (path) in storage',
    example: 'uploads/1234567890-document.pdf',
  })
  key: string;

  @ApiProperty({
    description: 'Full URL to access the file',
    example: 'https://storage.example.com/uploads/1234567890-document.pdf',
  })
  url: string;

  @ApiProperty({
    description: 'Public URL (if file is public)',
    example: 'https://storage.example.com/uploads/1234567890-document.pdf',
    required: false,
  })
  publicUrl?: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 1024000,
  })
  size: number;

  @ApiProperty({
    description: 'ETag of the uploaded file',
    example: 'd41d8cd98f00b204e9800998ecf8427e',
    required: false,
  })
  etag?: string;
}

