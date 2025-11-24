import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { IStorageProvider } from '@/infrastructure/file/interfaces';
import { StorageProviderFactory } from '@/infrastructure/file/providers';
import {
  UploadOptions,
  UploadResult,
  FileMetadata,
  MulterFile,
} from '@/infrastructure/file/interfaces';

/**
 * File Service
 * Facade for storage operations
 * Uses Strategy pattern to delegate to specific provider (S3, MinIO)
 */
@Injectable()
export class FileService implements OnModuleInit {
  private readonly logger = new Logger(FileService.name);
  private storageProvider: IStorageProvider;

  constructor(private providerFactory: StorageProviderFactory) {}

  onModuleInit() {
    this.storageProvider = this.providerFactory.create();
    this.logger.log('File storage provider initialized');
  }

  /**
   * Upload file
   */
  async upload(
    file: Buffer | MulterFile,
    key: string,
    options?: UploadOptions,
  ): Promise<UploadResult> {
    return this.storageProvider.upload(file, key, options);
  }

  /**
   * Delete file
   */
  async delete(key: string): Promise<boolean> {
    return this.storageProvider.delete(key);
  }

  /**
   * Get signed URL for private file access
   */
  async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    return this.storageProvider.getSignedUrl(key, expiresIn);
  }

  /**
   * Get public URL for file
   */
  getPublicUrl(key: string): string {
    return this.storageProvider.getPublicUrl(key);
  }

  /**
   * Check if file exists
   */
  async exists(key: string): Promise<boolean> {
    return this.storageProvider.exists(key);
  }

  /**
   * Copy file within storage
   */
  async copy(sourceKey: string, destinationKey: string): Promise<boolean> {
    return this.storageProvider.copy(sourceKey, destinationKey);
  }

  /**
   * Get file metadata
   */
  async getMetadata(key: string): Promise<FileMetadata> {
    return this.storageProvider.getMetadata(key);
  }

  /**
   * Upload multiple files
   */
  async uploadMultiple(
    files: MulterFile[],
    keyPrefix: string,
    options?: UploadOptions,
  ): Promise<UploadResult[]> {
    const uploadPromises = files.map((file, index) => {
      const key = `${keyPrefix}/${Date.now()}-${index}-${file.originalname}`;
      return this.upload(file, key, options);
    });

    return Promise.all(uploadPromises);
  }

  /**
   * Delete multiple files
   */
  async deleteMultiple(keys: string[]): Promise<boolean[]> {
    const deletePromises = keys.map((key) => this.delete(key));
    return Promise.all(deletePromises);
  }
}
