import { ApiProperty } from '@nestjs/swagger';

export class UserResponse {
  @ApiProperty({ description: 'User ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'Email address', example: 'user@example.com' })
  email: string;

  @ApiProperty({
    description: 'Phone number',
    example: '+84901234567',
    required: false,
  })
  phone?: string;

  @ApiProperty({
    description: 'User role',
    example: 'PARENT',
    enum: ['PARENT', 'TUTOR', 'ADMIN'],
  })
  role: string;

  @ApiProperty({ description: 'First name', example: 'John' })
  firstName: string;

  @ApiProperty({ description: 'Last name', example: 'Doe' })
  lastName: string;

  @ApiProperty({
    description: 'Avatar URL',
    example: 'https://example.com/avatar.jpg',
    required: false,
  })
  avatarUrl?: string;

  @ApiProperty({
    description: 'Gender',
    example: 'MALE',
    enum: ['MALE', 'FEMALE', 'OTHER'],
    required: false,
  })
  gender?: string;

  @ApiProperty({
    description: 'Date of birth',
    example: '2000-01-01T00:00:00.000Z',
    required: false,
  })
  dateOfBirth?: Date;

  @ApiProperty({
    description: 'Address',
    example: '123 Main St',
    required: false,
  })
  address?: string;

  @ApiProperty({
    description: 'City',
    example: 'Ho Chi Minh City',
    required: false,
  })
  city?: string;

  @ApiProperty({
    description: 'District',
    example: 'District 1',
    required: false,
  })
  district?: string;

  @ApiProperty({ description: 'Ward', example: 'Ward 1', required: false })
  ward?: string;

  @ApiProperty({
    description: 'User status',
    example: 'ACTIVE',
    enum: ['ACTIVE', 'INACTIVE', 'BANNED'],
  })
  status: string;

  @ApiProperty({ description: 'Email verified', example: true })
  emailVerified: boolean;

  @ApiProperty({ description: 'Phone verified', example: false })
  phoneVerified: boolean;

  @ApiProperty({
    description: 'Created at',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Updated at',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;
}
