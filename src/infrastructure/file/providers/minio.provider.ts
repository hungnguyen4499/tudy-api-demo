import { Injectable, Logger } from '@nestjs/common';
import * as MinIO from 'minio';
import { StorageConfigService } from '@/config';
import {
  IStorageProvider,
  UploadOptions,
  UploadResult,
  FileMetadata,
  MulterFile,
} from '@/infrastructure/file/interfaces';

@Injectable()
export class MinIOProvider implements IStorageProvider {
  private readonly logger = new Logger(MinIOProvider.name);
  private readonly client: MinIO.Client;
  private readonly bucketName: string;
  private readonly endpoint: string;
  private readonly useSSL: boolean;
  private readonly port: number;

  constructor(private storageConfig: StorageConfigService) {
    const config = storageConfig.getConfig().minio;

    this.endpoint = config.endpoint;
    this.port = config.port;
    this.useSSL = config.useSSL;
    this.bucketName = config.bucket;

    this.client = new MinIO.Client({
      endPoint: this.endpoint,
      port: this.port,
      useSSL: this.useSSL,
      accessKey: config.accessKey,
      secretKey: config.secretKey,
    });

    this.ensureBucketExists();
  }

  /**
   * Ensure bucket exists, create if not
   */
  private async ensureBucketExists(): Promise<void> {
    try {
      const exists = await this.client.bucketExists(this.bucketName);
      if (!exists) {
        await this.client.makeBucket(this.bucketName, 'us-east-1');
        this.logger.log(`Created bucket: ${this.bucketName}`);
      } else {
        this.logger.log(`Bucket exists: ${this.bucketName}`);
      }
    } catch (error) {
      this.logger.error(`Failed to ensure bucket exists: ${error.message}`);
      throw error;
    }
  }

  async upload(
    file: Buffer | MulterFile,
    key: string,
    options?: UploadOptions,
  ): Promise<UploadResult> {
    try {
      const buffer = Buffer.isBuffer(file) ? file : file.buffer;
      const contentType =
        options?.contentType ||
        (file as MulterFile)?.mimetype ||
        'application/octet-stream';

      const metaData: Record<string, string> = {
        'Content-Type': contentType,
        ...options?.metadata,
      };

      if (options?.cacheControl) {
        metaData['Cache-Control'] = options.cacheControl;
      }

      const result = await this.client.putObject(
        this.bucketName,
        key,
        buffer,
        buffer.length,
        metaData,
      );

      const publicUrl = this.getPublicUrl(key);

      this.logger.log(`File uploaded to MinIO: ${key}`);

      return {
        key,
        url: publicUrl,
        publicUrl: options?.acl === 'public-read' ? publicUrl : undefined,
        etag: result.etag,
        size: buffer.length,
      };
    } catch (error) {
      this.logger.error(`Failed to upload file ${key}: ${error.message}`);
      throw error;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      await this.client.removeObject(this.bucketName, key);
      this.logger.log(`File deleted from MinIO: ${key}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete file ${key}: ${error.message}`);
      return false;
    }
  }

  async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    try {
      const url = await this.client.presignedGetObject(
        this.bucketName,
        key,
        expiresIn,
      );
      return url;
    } catch (error) {
      this.logger.error(
        `Failed to generate signed URL for ${key}: ${error.message}`,
      );
      throw error;
    }
  }

  getPublicUrl(key: string): string {
    const protocol = this.useSSL ? 'https' : 'http';
    return `${protocol}://${this.endpoint}:${this.port}/${this.bucketName}/${key}`;
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.client.statObject(this.bucketName, key);
      return true;
    } catch (error) {
      return false;
    }
  }

  async copy(sourceKey: string, destinationKey: string): Promise<boolean> {
    try {
      const copyConditions = new MinIO.CopyConditions();
      await this.client.copyObject(
        this.bucketName,
        destinationKey,
        `/${this.bucketName}/${sourceKey}`,
        copyConditions,
      );
      this.logger.log(
        `File copied in MinIO: ${sourceKey} -> ${destinationKey}`,
      );
      return true;
    } catch (error) {
      this.logger.error(`Failed to copy file: ${error.message}`);
      return false;
    }
  }

  async getMetadata(key: string): Promise<FileMetadata> {
    try {
      const stat = await this.client.statObject(this.bucketName, key);
      return {
        key,
        size: stat.size,
        contentType: stat.metaData['content-type'],
        lastModified: stat.lastModified,
        etag: stat.etag,
      };
    } catch (error) {
      this.logger.error(`Failed to get metadata for ${key}: ${error.message}`);
      throw error;
    }
  }
}
