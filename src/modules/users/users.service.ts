import { Injectable } from '@nestjs/common';
import { BusinessException } from '@/common/exceptions/business.exception';
import { ErrorCodes } from '@/common/constants';
import { UpdateUserRequest, UsersQuery, UserResponse } from './dto';
import { UsersRepository } from './repositories/users.repository';
import { UserMapper } from './mappers/user.mapper';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly userMapper: UserMapper,
  ) {}

  /**
   * Get user by ID
   */
  async findOne(id: number): Promise<UserResponse> {
    const user = await this.usersRepository.findById(id);

    if (!user || user.isDeleted) {
      throw new BusinessException(ErrorCodes.USER_NOT_FOUND);
    }

    // Get primary role from UserRole
    const roleName = await this.usersRepository.getPrimaryRoleName(id);
    const response = this.userMapper.toResponse(user);
    response.role = roleName || 'parent'; // Default fallback

    return response;
  }

  /**
   * Get all users with pagination and filters
   */
  async findAll(query: UsersQuery) {
    const { page = 1, pageSize = 10, role, status, search } = query;

    const result = await this.usersRepository.findMany({
      role,
      status,
      search,
      skip: query.skip,
      take: query.take,
    });

    // Load roles for all users
    const items = await Promise.all(
      result.users.map(async (user) => {
        const roleName = await this.usersRepository.getPrimaryRoleName(user.id);
        const response = this.userMapper.toResponse(user);
        response.role = roleName || 'parent'; // Default fallback
        return response;
      }),
    );

    return {
      items,
      page,
      pageSize,
      total: result.total,
    };
  }

  /**
   * Update user
   */
  async update(id: number, request: UpdateUserRequest): Promise<UserResponse> {
    const existingUser = await this.usersRepository.findById(id);

    if (!existingUser || existingUser.isDeleted) {
      throw new BusinessException(ErrorCodes.USER_NOT_FOUND);
    }

    // Check phone uniqueness
    if (request.phone && request.phone !== existingUser.phone) {
      const phoneExists = await this.usersRepository.phoneExists(request.phone, id);
      if (phoneExists) {
        throw new BusinessException(ErrorCodes.PHONE_ALREADY_EXISTS);
      }
    }

    // Build update data
    const updateData = this.buildUpdateData(request);
    const updatedUser = await this.usersRepository.update(id, updateData);

    // Get primary role from UserRole
    const roleName = await this.usersRepository.getPrimaryRoleName(id);
    const response = this.userMapper.toResponse(updatedUser);
    response.role = roleName || 'parent'; // Default fallback

    return response;
  }

  /**
   * Soft delete user
   */
  async delete(id: number): Promise<void> {
    const user = await this.usersRepository.findById(id);

    if (!user || user.isDeleted) {
      throw new BusinessException(ErrorCodes.USER_NOT_FOUND);
    }

    // Soft delete
    await this.usersRepository.softDelete(id);
  }

  /**
   * Build update data from request
   */
  private buildUpdateData(request: UpdateUserRequest): Record<string, unknown> {
    const data: Record<string, unknown> = {};

    if (request.firstName !== undefined) data.firstName = request.firstName;
    if (request.lastName !== undefined) data.lastName = request.lastName;
    if (request.avatarUrl !== undefined) data.avatarUrl = request.avatarUrl;
    if (request.gender !== undefined) data.gender = request.gender;
    if (request.dateOfBirth !== undefined) data.dateOfBirth = new Date(request.dateOfBirth);
    if (request.address !== undefined) data.address = request.address;
    if (request.city !== undefined) data.city = request.city;
    if (request.district !== undefined) data.district = request.district;
    if (request.ward !== undefined) data.ward = request.ward;
    if (request.phone !== undefined) data.phone = request.phone;
    if (request.status !== undefined) data.status = request.status;

    return data;
  }
}
