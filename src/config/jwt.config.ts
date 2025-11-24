import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * JWT Configuration
 */
export interface JWTConfig {
  secret: string;
  refreshSecret: string;
  expiresIn: string;
  refreshExpiresIn: string;
}

@Injectable()
export class JWTConfigService {
  constructor(private configService: ConfigService) {}

  getConfig(): JWTConfig {
    const config: JWTConfig = {
      secret: this.configService.get<string>('JWT_SECRET') || '',
      refreshSecret: this.configService.get<string>('JWT_REFRESH_SECRET') || '',
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '1h'),
      refreshExpiresIn: this.configService.get<string>(
        'JWT_REFRESH_EXPIRES_IN',
        '7d',
      ),
    };

    this.validate(config);
    return config;
  }

  private validate(config: JWTConfig): void {
    if (!config.secret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }
    if (!config.refreshSecret) {
      throw new Error(
        'JWT_REFRESH_SECRET is not defined in environment variables',
      );
    }
  }
}
