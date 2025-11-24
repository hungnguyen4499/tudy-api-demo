import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Application Configuration
 */
export interface AppConfig {
  port: number;
  nodeEnv: string;
  apiPrefix: string;
}

@Injectable()
export class AppConfigService {
  constructor(private configService: ConfigService) {}

  getConfig(): AppConfig {
    return {
      port: this.configService.get<number>('PORT', 3000),
      nodeEnv: this.configService.get<string>('NODE_ENV', 'development'),
      apiPrefix: this.configService.get<string>('API_PREFIX', 'api/v1'),
    };
  }

  isDevelopment(): boolean {
    return this.getConfig().nodeEnv === 'development';
  }

  isProduction(): boolean {
    return this.getConfig().nodeEnv === 'production';
  }

  isTest(): boolean {
    return this.getConfig().nodeEnv === 'test';
  }
}

