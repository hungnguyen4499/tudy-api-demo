import { Injectable, Logger } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  CopyObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { StorageConfigService } from '@/config';
import {
  IStorageProvider,
  UploadOptions,
  UploadResult,
  FileMetadata,
  MulterFile,
} from '../interfaces/storage-provider.interface';

@Injectable()
export class S3Provider implements IStorageProvider {
  private readonly logger = new Logger(S3Provider.name);
  private readonly client: S3Client;
  private readonly bucketName: string;
  private readonly region: string;
  private readonly cdnUrl?: string;

  constructor(private storageConfig: StorageConfigService) {
    const config = storageConfig.getConfig().s3;

    this.region = config.region;
    this.bucketName = config.bucket;
    this.cdnUrl = config.cloudfrontUrl;

    this.client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });

    this.logger.log(`S3 provider initialized for bucket: ${this.bucketName} in region: ${this.region}`);
  }

  async upload(
    file: Buffer | MulterFile,
    key: string,
    options?: UploadOptions,
  ): Promise<UploadResult> {
    try {
      const buffer = Buffer.isBuffer(file) ? file : file.buffer;
      const contentType = options?.contentType || (file as MulterFile)?.mimetype || 'application/octet-stream';

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        ACL: options?.acl,
        Metadata: options?.metadata,
        CacheControl: options?.cacheControl,
      });

      const result = await this.client.send(command);
      const publicUrl = this.getPublicUrl(key);

      this.logger.log(`File uploaded to S3: ${key}`);

      return {
        key,
        url: publicUrl,
        publicUrl: options?.acl === 'public-read' ? publicUrl : undefined,
        etag: result.ETag?.replace(/"/g, ''),
        size: buffer.length,
      };
    } catch (error) {
      this.logger.error(`Failed to upload file to S3 ${key}: ${error.message}`);
      throw error;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.client.send(command);
      this.logger.log(`File deleted from S3: ${key}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete file from S3 ${key}: ${error.message}`);
      return false;
    }
  }

  async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const url = await getSignedUrl(this.client, command, { expiresIn });
      return url;
    } catch (error) {
      this.logger.error(`Failed to generate signed URL for ${key}: ${error.message}`);
      throw error;
    }
  }

  getPublicUrl(key: string): string {
    if (this.cdnUrl) {
      return `${this.cdnUrl}/${key}`;
    }
    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
  }

  async exists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.client.send(command);
      return true;
    } catch (error) {
      return false;
    }
  }

  async copy(sourceKey: string, destinationKey: string): Promise<boolean> {
    try {
      const command = new CopyObjectCommand({
        Bucket: this.bucketName,
        CopySource: `${this.bucketName}/${sourceKey}`,
        Key: destinationKey,
      });

      await this.client.send(command);
      this.logger.log(`File copied in S3: ${sourceKey} -> ${destinationKey}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to copy file in S3: ${error.message}`);
      return false;
    }
  }

  async getMetadata(key: string): Promise<FileMetadata> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const result = await this.client.send(command);

      return {
        key,
        size: result.ContentLength || 0,
        contentType: result.ContentType,
        lastModified: result.LastModified,
        etag: result.ETag?.replace(/"/g, ''),
      };
    } catch (error) {
      this.logger.error(`Failed to get metadata for ${key}: ${error.message}`);
      throw error;
    }
  }
}

