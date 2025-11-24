import { Injectable, Logger } from '@nestjs/common';
import { StorageConfigService } from '@/config';
import { IStorageProvider } from '@/infrastructure/file/interfaces';
import { MinIOProvider } from './minio.provider';
import { S3Provider } from './s3.provider';

export enum StorageProviderType {
  MINIO = 'minio',
  S3 = 's3',
}

/**
 * Storage Provider Factory
 * Creates storage provider instance based on configuration
 */
@Injectable()
export class StorageProviderFactory {
  private readonly logger = new Logger(StorageProviderFactory.name);

  constructor(private storageConfig: StorageConfigService) {}

  /**
   * Create storage provider based on environment configuration
   */
  create(): IStorageProvider {
    const providerType = this.storageConfig.getProvider();

    this.logger.log(`Creating storage provider: ${providerType}`);

    switch (providerType) {
      case StorageProviderType.S3:
        return new S3Provider(this.storageConfig);

      case StorageProviderType.MINIO:
      default:
        return new MinIOProvider(this.storageConfig);
    }
  }

  /**
   * Create specific provider (for testing or manual selection)
   */
  createProvider(type: StorageProviderType): IStorageProvider {
    switch (type) {
      case StorageProviderType.S3:
        return new S3Provider(this.storageConfig);

      case StorageProviderType.MINIO:
        return new MinIOProvider(this.storageConfig);

      default:
        throw new Error(`Unsupported storage provider: ${type}`);
    }
  }
}
