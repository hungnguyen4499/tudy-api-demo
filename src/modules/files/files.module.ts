import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { FileModule } from '@/infrastructure';

/**
 * Files Module
 * Handles file upload, download, and management operations
 * Uses FileService from infrastructure layer
 */
@Module({
  imports: [FileModule],
  controllers: [FilesController],
  providers: [],
})
export class FilesModule {}

