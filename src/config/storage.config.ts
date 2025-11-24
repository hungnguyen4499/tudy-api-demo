import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { parseBoolean } from '@/common/utils/config.util';

/**
 * Storage Provider Type
 */
export type StorageProviderType = 'minio' | 's3';

/**
 * Storage Configuration
 */
export interface StorageConfig {
  provider: StorageProviderType;
  minio: MinIOConfig;
  s3: S3Config;
}

/**
 * MinIO Configuration
 */
export interface MinIOConfig {
  endpoint: string;
  port: number;
  useSSL: boolean;
  accessKey: string;
  secretKey: string;
  bucket: string;
}

/**
 * AWS S3 Configuration
 */
export interface S3Config {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  cloudfrontUrl?: string;
}

@Injectable()
export class StorageConfigService {
  constructor(private configService: ConfigService) {}

  getConfig(): StorageConfig {
    return {
      provider: this.getProvider(),
      minio: this.getMinIOConfig(),
      s3: this.getS3Config(),
    };
  }

  getProvider(): StorageProviderType {
    const provider = this.configService.get<string>('STORAGE_PROVIDER', 'minio');
    if (provider !== 'minio' && provider !== 's3') {
      throw new Error(`Invalid STORAGE_PROVIDER: ${provider}. Must be 'minio' or 's3'`);
    }
    return provider as StorageProviderType;
  }

  private getMinIOConfig(): MinIOConfig {
    const config: MinIOConfig = {
      endpoint: this.configService.get<string>('MINIO_ENDPOINT', 'localhost'),
      port: this.configService.get<number>('MINIO_PORT', 9000),
      useSSL: parseBoolean(this.configService.get<string>('MINIO_USE_SSL'), false),
      accessKey: this.configService.get<string>('MINIO_ACCESS_KEY') || '',
      secretKey: this.configService.get<string>('MINIO_SECRET_KEY') || '',
      bucket: this.configService.get<string>('MINIO_BUCKET', 'tudy'),
    };

    this.validateMinIOConfig(config);
    return config;
  }

  private getS3Config(): S3Config {
    const config: S3Config = {
      region: this.configService.get<string>('AWS_REGION', 'us-east-1'),
      accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID') || '',
      secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY') || '',
      bucket: this.configService.get<string>('AWS_S3_BUCKET', 'tudy'),
      cloudfrontUrl: this.configService.get<string>('AWS_CLOUDFRONT_URL'),
    };

    this.validateS3Config(config);
    return config;
  }

  private validateMinIOConfig(config: MinIOConfig): void {
    if (!config.accessKey || !config.secretKey) {
      throw new Error('MINIO_ACCESS_KEY and MINIO_SECRET_KEY must be configured');
    }
  }

  private validateS3Config(config: S3Config): void {
    if (!config.accessKeyId || !config.secretAccessKey) {
      throw new Error('AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY must be configured');
    }
  }
}

