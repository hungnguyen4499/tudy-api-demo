/**
 * Error Code Interface
 */
export interface IErrorCode {
  code: string;
  message: string;
  httpStatus: number;
}

/**
 * Error Code System
 * 
 * Using string constants for better readability and debugging
 * Each error code includes:
 * - code: String constant (e.g., 'USER_NOT_FOUND')
 * - message: Human-readable message
 * - httpStatus: HTTP status code (400, 401, 403, 404, 409, 500)
 * 
 * Module prefixes:
 * - COMMON_*: Common errors
 * - AUTH_*: Authentication errors
 * - USER_*: User management errors
 */

// ============================================
// COMMON ERRORS
// ============================================
export const CommonErrors = {
  SUCCESS: {
    code: 'SUCCESS',
    message: 'Success',
    httpStatus: 200,
  },
  VALIDATION_ERROR: {
    code: 'VALIDATION_ERROR',
    message: 'Validation error',
    httpStatus: 400,
  },
  INVALID_INPUT: {
    code: 'INVALID_INPUT',
    message: 'Invalid input data',
    httpStatus: 400,
  },
  INVALID_PARAMS: {
    code: 'INVALID_PARAMS',
    message: 'Invalid parameters',
    httpStatus: 400,
  },
  MISSING_REQUIRED_FIELD: {
    code: 'MISSING_REQUIRED_FIELD',
    message: 'Missing required field',
    httpStatus: 400,
  },
  UNAUTHORIZED: {
    code: 'UNAUTHORIZED',
    message: 'Unauthorized',
    httpStatus: 401,
  },
  INVALID_TOKEN: {
    code: 'INVALID_TOKEN',
    message: 'Invalid token',
    httpStatus: 401,
  },
  TOKEN_EXPIRED: {
    code: 'TOKEN_EXPIRED',
    message: 'Token expired',
    httpStatus: 401,
  },
  TOKEN_REQUIRED: {
    code: 'TOKEN_REQUIRED',
    message: 'Token required',
    httpStatus: 401,
  },
  FORBIDDEN: {
    code: 'FORBIDDEN',
    message: 'Forbidden',
    httpStatus: 403,
  },
  INSUFFICIENT_PERMISSIONS: {
    code: 'INSUFFICIENT_PERMISSIONS',
    message: 'Insufficient permissions',
    httpStatus: 403,
  },
  NOT_FOUND: {
    code: 'NOT_FOUND',
    message: 'Resource not found',
    httpStatus: 404,
  },
  RESOURCE_NOT_FOUND: {
    code: 'RESOURCE_NOT_FOUND',
    message: 'Resource not found',
    httpStatus: 404,
  },
  CONFLICT: {
    code: 'CONFLICT',
    message: 'Resource conflict',
    httpStatus: 409,
  },
  DUPLICATE_RESOURCE: {
    code: 'DUPLICATE_RESOURCE',
    message: 'Duplicate resource',
    httpStatus: 409,
  },
  INTERNAL_ERROR: {
    code: 'INTERNAL_ERROR',
    message: 'Internal server error',
    httpStatus: 500,
  },
  INTERNAL_SERVER_ERROR: {
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Internal server error',
    httpStatus: 500,
  },
  DATABASE_ERROR: {
    code: 'DATABASE_ERROR',
    message: 'Database error',
    httpStatus: 500,
  },
  EXTERNAL_SERVICE_ERROR: {
    code: 'EXTERNAL_SERVICE_ERROR',
    message: 'External service error',
    httpStatus: 500,
  },
} as const;

// ============================================
// AUTH MODULE
// ============================================
export const AuthErrors = {
  INVALID_CREDENTIALS: {
    code: 'AUTH_INVALID_CREDENTIALS',
    message: 'Invalid email or password',
    httpStatus: 400,
  },
  WEAK_PASSWORD: {
    code: 'AUTH_WEAK_PASSWORD',
    message: 'Password is too weak',
    httpStatus: 400,
  },
  PASSWORD_MISMATCH: {
    code: 'AUTH_PASSWORD_MISMATCH',
    message: 'Password does not match',
    httpStatus: 400,
  },
  INVALID_OTP: {
    code: 'AUTH_INVALID_OTP',
    message: 'Invalid OTP code',
    httpStatus: 400,
  },
  OTP_EXPIRED: {
    code: 'AUTH_OTP_EXPIRED',
    message: 'OTP code has expired',
    httpStatus: 400,
  },
  OTP_TOO_MANY_ATTEMPTS: {
    code: 'AUTH_OTP_TOO_MANY_ATTEMPTS',
    message: 'Too many OTP attempts',
    httpStatus: 400,
  },
  LOGIN_REQUIRED: {
    code: 'AUTH_LOGIN_REQUIRED',
    message: 'Login required',
    httpStatus: 401,
  },
  INVALID_REFRESH_TOKEN: {
    code: 'AUTH_INVALID_REFRESH_TOKEN',
    message: 'Invalid refresh token',
    httpStatus: 401,
  },
  SESSION_EXPIRED: {
    code: 'AUTH_SESSION_EXPIRED',
    message: 'Session has expired',
    httpStatus: 401,
  },
  EMAIL_ALREADY_EXISTS: {
    code: 'AUTH_EMAIL_ALREADY_EXISTS',
    message: 'Email already exists',
    httpStatus: 409,
  },
  PHONE_ALREADY_EXISTS: {
    code: 'AUTH_PHONE_ALREADY_EXISTS',
    message: 'Phone number already exists',
    httpStatus: 409,
  },
  USERNAME_TAKEN: {
    code: 'AUTH_USERNAME_TAKEN',
    message: 'Username is already taken',
    httpStatus: 409,
  },
  USER_NOT_FOUND: {
    code: 'AUTH_USER_NOT_FOUND',
    message: 'User not found',
    httpStatus: 404,
  },
  ACCOUNT_NOT_FOUND: {
    code: 'AUTH_ACCOUNT_NOT_FOUND',
    message: 'Account not found',
    httpStatus: 404,
  },
} as const;

// ============================================
// USER MODULE
// ============================================
export const UserErrors = {
  INVALID_USER_DATA: {
    code: 'USER_INVALID_DATA',
    message: 'Invalid user data',
    httpStatus: 400,
  },
  INVALID_PROFILE_UPDATE: {
    code: 'USER_INVALID_PROFILE_UPDATE',
    message: 'Invalid profile update data',
    httpStatus: 400,
  },
  USER_BANNED: {
    code: 'USER_BANNED',
    message: 'User account has been banned',
    httpStatus: 403,
  },
  USER_INACTIVE: {
    code: 'USER_INACTIVE',
    message: 'User account is inactive',
    httpStatus: 403,
  },
  ACCOUNT_SUSPENDED: {
    code: 'USER_ACCOUNT_SUSPENDED',
    message: 'Account has been suspended',
    httpStatus: 403,
  },
  USER_NOT_FOUND: {
    code: 'USER_NOT_FOUND',
    message: 'User not found',
    httpStatus: 404,
  },
  PROFILE_NOT_FOUND: {
    code: 'USER_PROFILE_NOT_FOUND',
    message: 'Profile not found',
    httpStatus: 404,
  },
  USER_ALREADY_EXISTS: {
    code: 'USER_ALREADY_EXISTS',
    message: 'User already exists',
    httpStatus: 409,
  },
} as const;

// ============================================
// SYSTEM MODULE (Role, Permission, Menu)
// ============================================
export const SystemErrors = {
  // Role errors
  ROLE_NOT_FOUND: {
    code: 'ROLE_NOT_FOUND',
    message: 'Role not found',
    httpStatus: 404,
  },
  ROLE_NAME_EXISTS: {
    code: 'ROLE_NAME_EXISTS',
    message: 'Role name already exists',
    httpStatus: 409,
  },
  ROLE_NOT_MODIFIABLE: {
    code: 'ROLE_NOT_MODIFIABLE',
    message: 'Cannot modify system role',
    httpStatus: 400,
  },
  ROLE_HAS_USERS: {
    code: 'ROLE_HAS_USERS',
    message: 'Cannot delete role with assigned users',
    httpStatus: 400,
  },
  USER_HAS_NO_ROLE: {
    code: 'USER_HAS_NO_ROLE',
    message: 'User has no role assignment',
    httpStatus: 400,
  },
  ROLE_ALREADY_ASSIGNED: {
    code: 'ROLE_ALREADY_ASSIGNED',
    message: 'Role is already assigned to this user',
    httpStatus: 409,
  },
  CANNOT_ASSIGN_GLOBAL_ROLE: {
    code: 'CANNOT_ASSIGN_GLOBAL_ROLE',
    message: 'Cannot assign global scope role',
    httpStatus: 403,
  },
  CANNOT_ASSIGN_ROLE_DIFFERENT_ORG: {
    code: 'CANNOT_ASSIGN_ROLE_DIFFERENT_ORG',
    message: 'Cannot assign role to user from different organization',
    httpStatus: 403,
  },
  INSUFFICIENT_SCOPE_TO_ASSIGN_ROLE: {
    code: 'INSUFFICIENT_SCOPE_TO_ASSIGN_ROLE',
    message: 'Insufficient data scope to assign this role',
    httpStatus: 403,
  },

  // Permission errors
  PERMISSION_NOT_FOUND: {
    code: 'PERMISSION_NOT_FOUND',
    message: 'Permission not found',
    httpStatus: 404,
  },
  PERMISSION_CODE_EXISTS: {
    code: 'PERMISSION_CODE_EXISTS',
    message: 'Permission code already exists',
    httpStatus: 409,
  },
  PERMISSION_IN_USE: {
    code: 'PERMISSION_IN_USE',
    message: 'Cannot delete permission that is in use',
    httpStatus: 400,
  },

  // Menu errors
  MENU_NOT_FOUND: {
    code: 'MENU_NOT_FOUND',
    message: 'Menu not found',
    httpStatus: 404,
  },
  MENU_CODE_EXISTS: {
    code: 'MENU_CODE_EXISTS',
    message: 'Menu code already exists',
    httpStatus: 409,
  },
  MENU_PARENT_NOT_FOUND: {
    code: 'MENU_PARENT_NOT_FOUND',
    message: 'Parent menu not found',
    httpStatus: 400,
  },
  MENU_SELF_PARENT: {
    code: 'MENU_SELF_PARENT',
    message: 'Menu cannot be its own parent',
    httpStatus: 400,
  },
  MENU_HAS_CHILDREN: {
    code: 'MENU_HAS_CHILDREN',
    message: 'Cannot delete menu with child menus',
    httpStatus: 400,
  },
} as const;

// ============================================
// AGGREGATE ALL ERRORS
// ============================================
export const ErrorCodes = {
  ...CommonErrors,
  ...AuthErrors,
  ...UserErrors,
  ...SystemErrors,
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
