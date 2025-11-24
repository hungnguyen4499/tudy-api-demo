import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Query,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import type { MulterFile } from '@/infrastructure/file/interfaces';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { FileService } from '@/infrastructure';
import {
  UploadFileRequest,
  UploadFileResponse,
  FileMetadataResponse,
} from './dto';
import { Result } from '@/common/dto/result.dto';

/**
 * Files Controller
 * Handles file upload, download, and management operations
 */
@ApiTags('files')
@Controller('files')
@ApiBearerAuth()
export class FilesController {
  constructor(private readonly fileService: FileService) {}

  /**
   * Upload single file
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a single file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        folder: {
          type: 'string',
          description: 'Optional folder path',
          example: 'uploads',
        },
        acl: {
          type: 'string',
          enum: ['private', 'public-read', 'public-read-write'],
          description: 'Access control level',
          example: 'public-read',
        },
      },
    },
  })
  async uploadFile(
    @UploadedFile() file: MulterFile,
    @Body() body: UploadFileRequest,
  ): Promise<Result<UploadFileResponse>> {
    if (!file) {
      throw new Error('No file uploaded');
    }

    const folderPath = body.folder || 'uploads';
    const key = `${folderPath}/${Date.now()}-${file.originalname}`;

    const result = await this.fileService.upload(file, key, {
      contentType: file.mimetype,
      acl: body.acl || 'public-read',
    });

    return Result.success({
      key: result.key,
      url: result.url,
      publicUrl: result.publicUrl,
      size: result.size,
      etag: result.etag,
    });
  }

  /**
   * Upload multiple files
   */
  @Post('upload-multiple')
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiOperation({ summary: 'Upload multiple files' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
        folder: {
          type: 'string',
          description: 'Optional folder path',
          example: 'uploads',
        },
        acl: {
          type: 'string',
          enum: ['private', 'public-read', 'public-read-write'],
          description: 'Access control level',
          example: 'public-read',
        },
      },
    },
  })
  async uploadMultipleFiles(
    @UploadedFiles() files: MulterFile[],
    @Body() body: UploadFileRequest,
  ): Promise<Result<UploadFileResponse[]>> {
    if (!files || files.length === 0) {
      throw new Error('No files uploaded');
    }

    const folderPath = body.folder || 'uploads';
    const keyPrefix = folderPath;

    const results = await this.fileService.uploadMultiple(files, keyPrefix, {
      acl: body.acl || 'public-read',
    });

    const response = results.map((result) => ({
      key: result.key,
      url: result.url,
      publicUrl: result.publicUrl,
      size: result.size,
      etag: result.etag,
    }));

    return Result.success(response);
  }

  /**
   * Get file URL (signed URL for private files, public URL for public files)
   */
  @Get(':key')
  @ApiOperation({ summary: 'Get file URL' })
  @ApiParam({
    name: 'key',
    description: 'File key (path) in storage',
    example: 'uploads/1234567890-document.pdf',
  })
  @ApiQuery({
    name: 'expiresIn',
    description: 'Expiration time in seconds for signed URL (default: 3600)',
    required: false,
    type: Number,
    example: 3600,
  })
  async getFileUrl(
    @Param('key') key: string,
    @Query('expiresIn') expiresIn?: string,
  ): Promise<Result<{ url: string }>> {
    const expiresInSeconds = expiresIn ? parseInt(expiresIn, 10) : 3600;
    const url = await this.fileService.getSignedUrl(key, expiresInSeconds);
    return Result.success({ url });
  }

  /**
   * Get file metadata
   */
  @Get(':key/metadata')
  @ApiOperation({ summary: 'Get file metadata' })
  @ApiParam({
    name: 'key',
    description: 'File key (path) in storage',
    example: 'uploads/1234567890-document.pdf',
  })
  async getFileMetadata(
    @Param('key') key: string,
  ): Promise<Result<FileMetadataResponse>> {
    const metadata = await this.fileService.getMetadata(key);
    return Result.success({
      key: metadata.key,
      size: metadata.size,
      contentType: metadata.contentType,
      lastModified: metadata.lastModified,
      etag: metadata.etag,
    });
  }

  /**
   * Check if file exists
   */
  @Get(':key/exists')
  @ApiOperation({ summary: 'Check if file exists' })
  @ApiParam({
    name: 'key',
    description: 'File key (path) in storage',
    example: 'uploads/1234567890-document.pdf',
  })
  async fileExists(
    @Param('key') key: string,
  ): Promise<Result<{ exists: boolean }>> {
    const exists = await this.fileService.exists(key);
    return Result.success({ exists });
  }

  /**
   * Delete single file
   */
  @Delete(':key')
  @ApiOperation({ summary: 'Delete a file' })
  @ApiParam({
    name: 'key',
    description: 'File key (path) in storage',
    example: 'uploads/1234567890-document.pdf',
  })
  async deleteFile(
    @Param('key') key: string,
  ): Promise<Result<{ success: boolean }>> {
    const success = await this.fileService.delete(key);
    return Result.success({ success });
  }

  /**
   * Delete multiple files
   */
  @Delete()
  @ApiOperation({ summary: 'Delete multiple files' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        keys: {
          type: 'array',
          items: {
            type: 'string',
          },
          example: ['uploads/file1.pdf', 'uploads/file2.pdf'],
        },
      },
    },
  })
  async deleteMultipleFiles(
    @Body('keys') keys: string[],
  ): Promise<Result<{ success: boolean[] }>> {
    if (!keys || keys.length === 0) {
      throw new Error('No keys provided');
    }

    const results = await this.fileService.deleteMultiple(keys);
    return Result.success({ success: results });
  }
}
