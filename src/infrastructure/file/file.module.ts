import { Global, Module } from '@nestjs/common';
import { FileService } from './file.service';

/**
 * File Module
 * Provides file operations globally
 */
@Global()
@Module({
  providers: [FileService],
  exports: [FileService],
})
export class FileModule {}

