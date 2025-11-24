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

    return this.userMapper.toResponse(user);
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

    return {
      items: this.userMapper.toResponseList(result.users),
      page,
      pageSize,
      total: result.total,
    };
  }

  /**
   * Update user
   */
  async update(id: number, request: UpdateUserRequest): Promise<UserResponse> {
    // Check if user exists
    const existingUser = await this.usersRepository.findById(id);

    if (!existingUser || existingUser.isDeleted) {
      throw new BusinessException(ErrorCodes.USER_NOT_FOUND);
    }

    // Check if phone is being updated and already exists
    if (request.phone && request.phone !== existingUser.phone) {
      const phoneExists = await this.usersRepository.phoneExists(
        request.phone,
        id,
      );

      if (phoneExists) {
        throw new BusinessException(ErrorCodes.PHONE_ALREADY_EXISTS);
      }
    }

    // Prepare update data
    const updateData: any = {};

    if (request.firstName !== undefined)
      updateData.firstName = request.firstName;
    if (request.lastName !== undefined) updateData.lastName = request.lastName;
    if (request.avatarUrl !== undefined)
      updateData.avatarUrl = request.avatarUrl;
    if (request.gender !== undefined) updateData.gender = request.gender;
    if (request.dateOfBirth !== undefined)
      updateData.dateOfBirth = new Date(request.dateOfBirth);
    if (request.address !== undefined) updateData.address = request.address;
    if (request.city !== undefined) updateData.city = request.city;
    if (request.district !== undefined) updateData.district = request.district;
    if (request.ward !== undefined) updateData.ward = request.ward;
    if (request.phone !== undefined) updateData.phone = request.phone;
    if (request.status !== undefined) updateData.status = request.status;

    // Update user
    const updatedUser = await this.usersRepository.update(id, updateData);

    return this.userMapper.toResponse(updatedUser);
  }

  /**
   * Soft delete user
   */
  async remove(id: number): Promise<void> {
    const user = await this.usersRepository.findById(id);

    if (!user || user.isDeleted) {
      throw new BusinessException(ErrorCodes.USER_NOT_FOUND);
    }

    // Soft delete
    await this.usersRepository.softDelete(id);
  }
}