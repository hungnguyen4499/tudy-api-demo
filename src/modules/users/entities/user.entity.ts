import { UserRole, UserStatus } from '@/common/constants';

/**
 * User Entity
 * Domain model representing a User
 * Independent of database/ORM implementation
 */
export class User {
  id: number;
  email: string;
  phone?: string;
  passwordHash: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  dateOfBirth?: Date;
  address?: string;
  city?: string;
  district?: string;
  ward?: string;
  lat?: number;
  lng?: number;
  status: UserStatus;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;

  constructor(data: Partial<User>) {
    Object.assign(this, data);
  }

  /**
   * Get full name
   */
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`.trim();
  }

  /**
   * Check if user is active
   */
  get isActive(): boolean {
    return this.status === UserStatus.ACTIVE && !this.deletedAt;
  }

  /**
   * Check if user is deleted
   */
  get isDeleted(): boolean {
    return !!this.deletedAt;
  }
}
