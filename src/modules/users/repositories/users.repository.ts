import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure';
import { User } from '../entities/user.entity';
import { UserRole, UserStatus } from '@/common/constants';
import { Prisma } from '@prisma/client';
import { UserMapper } from '../mappers/user.mapper';

export interface FindUsersOptions {
  role?: UserRole;
  status?: UserStatus;
  search?: string;
  skip?: number;
  take?: number;
}

/**
 * Users Repository
 * Handles all database operations for User entity
 * Abstracts Prisma implementation details
 */
@Injectable()
export class UsersRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userMapper: UserMapper,
  ) {}

  /**
   * Find user by ID
   */
  async findById(id: number): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return null;
    }

    return this.userMapper.toEntity(user);
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return null;
    }

    return this.userMapper.toEntity(user);
  }

  /**
   * Find user by phone
   */
  async findByPhone(phone: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { phone },
    });

    if (!user) {
      return null;
    }

    return this.userMapper.toEntity(user);
  }

  /**
   * Find all users with filters and pagination
   */
  async findMany(
    options: FindUsersOptions,
  ): Promise<{ users: User[]; total: number }> {
    const { role, status, search, skip = 0, take = 10 } = options;

    // Build where clause
    const where: Prisma.UserWhereInput = {
      deletedAt: null, // Only non-deleted users
    };

    if (role) {
      where.role = role;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await this.prisma.user.count({ where });

    // Get users
    const users = await this.prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });

    return {
      users: this.userMapper.toEntityList(users),
      total,
    };
  }

  /**
   * Create user
   */
  async create(data: Prisma.UserCreateInput): Promise<User> {
    const user = await this.prisma.user.create({
      data,
    });

    return this.userMapper.toEntity(user);
  }

  /**
   * Update user
   */
  async update(id: number, data: Prisma.UserUpdateInput): Promise<User> {
    const user = await this.prisma.user.update({
      where: { id },
      data,
    });

    return this.userMapper.toEntity(user);
  }

  /**
   * Soft delete user
   */
  async softDelete(id: number): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Hard delete user (permanent)
   */
  async delete(id: number): Promise<void> {
    await this.prisma.user.delete({
      where: { id },
    });
  }

  /**
   * Check if email exists
   */
  async emailExists(email: string, excludeId?: number): Promise<boolean> {
    const user = await this.prisma.user.findFirst({
      where: {
        email,
        ...(excludeId && { id: { not: excludeId } }),
      },
    });

    return !!user;
  }

  /**
   * Check if phone exists
   */
  async phoneExists(phone: string, excludeId?: number): Promise<boolean> {
    const user = await this.prisma.user.findFirst({
      where: {
        phone,
        ...(excludeId && { id: { not: excludeId } }),
      },
    });

    return !!user;
  }
}