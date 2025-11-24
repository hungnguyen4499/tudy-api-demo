/**
 * Multer file type
 */
export interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
  destination?: string;
  filename?: string;
  path?: string;
}

/**
 * Storage Provider Interface
 * Common interface for all storage providers (S3, MinIO, etc.)
 */
export interface IStorageProvider {
  /**
   * Upload file to storage
   */
  upload(
    file: Buffer | MulterFile,
    key: string,
    options?: UploadOptions,
  ): Promise<UploadResult>;

  /**
   * Delete file from storage
   */
  delete(key: string): Promise<boolean>;

  /**
   * Get signed URL for private file access
   */
  getSignedUrl(key: string, expiresIn?: number): Promise<string>;

  /**
   * Get public URL for file
   */
  getPublicUrl(key: string): string;

  /**
   * Check if file exists
   */
  exists(key: string): Promise<boolean>;

  /**
   * Copy file within storage
   */
  copy(sourceKey: string, destinationKey: string): Promise<boolean>;

  /**
   * Get file metadata
   */
  getMetadata(key: string): Promise<FileMetadata>;
}

/**
 * Upload options
 */
export interface UploadOptions {
  contentType?: string;
  acl?: 'private' | 'public-read' | 'public-read-write';
  metadata?: Record<string, string>;
  cacheControl?: string;
}

/**
 * Upload result
 */
export interface UploadResult {
  key: string;
  url: string;
  publicUrl?: string;
  etag?: string;
  size: number;
}

/**
 * File metadata
 */
export interface FileMetadata {
  key: string;
  size: number;
  contentType?: string;
  lastModified?: Date;
  etag?: string;
}
