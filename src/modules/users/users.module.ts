import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersRepository } from './repositories/users.repository';
import { UserMapper } from './mappers/user.mapper';

/**
 * Users Module
 * Handles user profile management
 */
@Module({
  controllers: [UsersController],
  providers: [UsersService, UsersRepository, UserMapper],
  exports: [UsersService, UsersRepository],
})
export class UsersModule {}