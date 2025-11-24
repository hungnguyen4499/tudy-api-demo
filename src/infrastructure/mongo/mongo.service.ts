import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

/**
 * MongoDB Service
 * For logs, analytics, and flexible data
 */
@Injectable()
export class MongoService implements OnModuleInit {
  private readonly logger = new Logger(MongoService.name);

  constructor(@InjectConnection() private readonly connection: Connection) {}

  async onModuleInit() {
    if (this.connection.readyState === 1) {
      this.logger.log('✅ MongoDB connected successfully');
    } else {
      this.logger.warn('⚠️  MongoDB connection is not ready');
    }

    this.connection.on('connected', () => {
      this.logger.log('MongoDB connected');
    });

    this.connection.on('disconnected', () => {
      this.logger.warn('MongoDB disconnected');
    });

    this.connection.on('error', (error) => {
      this.logger.error('MongoDB connection error:', error);
    });
  }

  /**
   * Get MongoDB connection
   */
  getConnection(): Connection {
    return this.connection;
  }
}

