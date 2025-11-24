import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Redis Configuration
 */
export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
}

@Injectable()
export class RedisConfigService {
  constructor(private configService: ConfigService) {}

  getConfig(): RedisConfig {
    return {
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: this.configService.get<string>('REDIS_PASSWORD'),
      db: this.configService.get<number>('REDIS_DB', 0),
    };
  }
}

