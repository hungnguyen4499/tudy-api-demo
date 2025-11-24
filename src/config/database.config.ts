import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Database Configuration
 */
export interface DatabaseConfig {
  url: string;
}

@Injectable()
export class DatabaseConfigService {
  constructor(private configService: ConfigService) {}

  getConfig(): DatabaseConfig {
    const url = this.configService.get<string>('DATABASE_URL');
    
    if (!url) {
      throw new Error('DATABASE_URL is not defined in environment variables');
    }

    return {
      url,
    };
  }
}

