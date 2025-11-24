import { Global, Module } from '@nestjs/common';
import { FileService } from './file.service';
import { StorageProviderFactory } from '@/infrastructure/file/providers';

/**
 * File Module
 * Provides file storage operations globally
 * Supports multiple storage providers (S3, MinIO) via Strategy pattern
 */
@Global()
@Module({
  providers: [FileService, StorageProviderFactory],
  exports: [FileService, StorageProviderFactory],
})
export class FileModule {}
