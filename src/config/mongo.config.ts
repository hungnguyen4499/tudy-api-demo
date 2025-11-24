import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * MongoDB Configuration
 */
export interface MongoConfig {
  uri: string;
  database: string;
}

@Injectable()
export class MongoConfigService {
  constructor(private configService: ConfigService) {}

  getConfig(): MongoConfig {
    const uri = this.configService.get<string>(
      'MONGODB_URI',
      'mongodb://localhost:27017/tudy_logs',
    );

    // Extract database name from URI or use default
    const database = this.extractDatabaseFromUri(uri) || 'tudy_logs';

    return {
      uri,
      database,
    };
  }

  private extractDatabaseFromUri(uri: string): string | null {
    const match = uri.match(/\/([^/?]+)(\?|$)/);
    return match ? match[1] : null;
  }
}

