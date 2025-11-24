import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { User } from '../entities/user.entity';
import { UserResponse } from '../dto/user-response.dto';
import { Prisma } from '@prisma/client';

/**
 * User Mapper
 * Handles mapping between Prisma models, User entities, and DTOs
 */
@Injectable()
export class UserMapper {
  /**
   * Map Prisma user to User entity
   */
  toEntity(prismaUser: Prisma.UserGetPayload<{}>): User {
    // Handle Prisma Decimal → number conversion for lat/lng
    const data = {
      ...prismaUser,
      lat: prismaUser.lat ? Number(prismaUser.lat) : undefined,
      lng: prismaUser.lng ? Number(prismaUser.lng) : undefined,
    };

    return plainToInstance(User, data);
  }

  /**
   * Map User entity to UserResponse DTO
   */
  toResponse(entity: User): UserResponse {
    return plainToInstance(UserResponse, entity);
  }

  /**
   * Map array of Prisma users to User entities
   */
  toEntityList(prismaUsers: Prisma.UserGetPayload<{}>[]): User[] {
    return prismaUsers.map((user) => this.toEntity(user));
  }

  /**
   * Map array of User entities to UserResponse DTOs
   */
  toResponseList(entities: User[]): UserResponse[] {
    return entities.map((entity) => this.toResponse(entity));
  }
}