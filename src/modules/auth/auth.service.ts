import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JWTConfigService } from '@/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '@/infrastructure';
import { BusinessException } from '@/common/exceptions/business.exception';
import { ErrorCodes, UserRole, UserStatus } from '@/common/constants';
import { RegisterRequest, LoginRequest, AuthResponse } from './dto';
import { JwtPayload } from '@/common/interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private jwtConfig: JWTConfigService,
  ) {}

  /**
   * Register new user
   */
  async register(request: RegisterRequest): Promise<AuthResponse> {
    // Check if email already exists
    const existingEmail = await this.prisma.user.findUnique({
      where: { email: request.email },
    });

    if (existingEmail) {
      throw new BusinessException(ErrorCodes.EMAIL_ALREADY_EXISTS);
    }

    // Check if phone already exists (if provided)
    if (request.phone) {
      const existingPhone = await this.prisma.user.findUnique({
        where: { phone: request.phone },
      });

      if (existingPhone) {
        throw new BusinessException(ErrorCodes.PHONE_ALREADY_EXISTS);
      }
    }

    // Validate password strength
    if (request.password.length < 8) {
      throw new BusinessException(ErrorCodes.WEAK_PASSWORD);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(request.password, 10);

    // Create user (no role field - roles are assigned via UserRole)
    const user = await this.prisma.user.create({
      data: {
        email: request.email,
        phone: request.phone,
        passwordHash,
        firstName: request.firstName,
        lastName: request.lastName,
        status: UserStatus.ACTIVE,
        emailVerified: true, // Auto-verify on registration
        phoneVerified: request.phone ? false : true,
      },
    });

    // Assign role via UserRole (RBAC)
    // Map UserRole enum to role name in database (lowercase with underscore)
    const roleNameMap: Record<UserRole, string> = {
      [UserRole.PARENT]: 'parent',
      [UserRole.TUTOR]: 'tutor',
      [UserRole.PARTNER_STAFF]: 'partner_staff',
      [UserRole.PARTNER_ADMIN]: 'partner_admin',
      [UserRole.KIGGLE_STAFF]: 'kiggle_staff',
      [UserRole.KIGGLE_ADMIN]: 'kiggle_admin',
    };

    const dbRoleName = roleNameMap[request.role];
    const role = await this.prisma.role.findUnique({
      where: { name: dbRoleName },
    });

    if (!role) {
      throw new BusinessException(ErrorCodes.ROLE_NOT_FOUND);
    }

    await this.prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: role.id,
      },
    });

    // Create parent profile if role is PARENT
    if (request.role === UserRole.PARENT) {
      await this.prisma.parent.create({
        data: {
          userId: user.id,
        },
      });
    }

    // Get role name for JWT (use role name from database)
    const jwtRoleName = role.name;

    // Generate and return tokens
    return this.generateTokens(user.id, user.email, jwtRoleName);
  }

  /**
   * Login user
   */
  async login(request: LoginRequest): Promise<AuthResponse> {
    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email: request.email },
    });

    if (!user) {
      throw new BusinessException(ErrorCodes.INVALID_CREDENTIALS);
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(
      request.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new BusinessException(ErrorCodes.INVALID_CREDENTIALS);
    }

    // Check user status
    if (user.status === UserStatus.BANNED) {
      throw new BusinessException(ErrorCodes.USER_BANNED);
    }

    if (user.status === UserStatus.INACTIVE) {
      throw new BusinessException(ErrorCodes.USER_INACTIVE);
    }

    // Get primary role from UserRole
    const userRole = await this.prisma.userRole.findFirst({
      where: {
        userId: user.id,
        expiresAt: null, // Not expired
      },
      include: {
        role: true,
      },
      orderBy: {
        assignedAt: 'desc', // Get most recent
      },
    });

    if (!userRole) {
      throw new BusinessException(ErrorCodes.USER_HAS_NO_ROLE);
    }

    const jwtRoleName = userRole.role.name;

    // Generate tokens
    return this.generateTokens(user.id, user.email, jwtRoleName);
  }

  /**
   * Refresh access token
   */
  async refreshToken(
    userId: number,
    email: string,
    role: string,
  ): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BusinessException(ErrorCodes.USER_NOT_FOUND);
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new BusinessException(ErrorCodes.USER_INACTIVE);
    }

    return this.generateTokens(userId, email, role);
  }

  /**
   * Generate JWT tokens
   */
  private async generateTokens(
    userId: number,
    email: string,
    role: string,
  ): Promise<AuthResponse> {
    const payload: JwtPayload = {
      sub: userId.toString(), // Convert number to string for JWT
      email,
      role,
    };

    const config = this.jwtConfig.getConfig();

    // Sign tokens with explicit secrets and expiry
    const accessToken = this.jwtService.sign(payload, {
      secret: config.secret,
      expiresIn: config.expiresIn,
    } as any);

    const refreshToken = this.jwtService.sign(payload, {
      secret: config.refreshSecret,
      expiresIn: config.refreshExpiresIn,
    } as any);

    // Calculate expiry dates
    return {
      accessToken,
      refreshToken,
      expiresIn: this.calculateExpiry(config.expiresIn),
      refreshExpiresIn: this.calculateExpiry(config.refreshExpiresIn),
    };
  }

  /**
   * Calculate expiry date from duration string
   */
  private calculateExpiry(duration: string): string {
    const now = new Date();
    const [value, unit] = duration.match(/(\d+)([dhms])/)?.slice(1) || [
      '1',
      'd',
    ];

    let milliseconds = parseInt(value);
    switch (unit) {
      case 'd':
        milliseconds *= 24 * 60 * 60 * 1000;
        break;
      case 'h':
        milliseconds *= 60 * 60 * 1000;
        break;
      case 'm':
        milliseconds *= 60 * 1000;
        break;
      case 's':
        milliseconds *= 1000;
        break;
    }

    return new Date(now.getTime() + milliseconds).toISOString();
  }
}
