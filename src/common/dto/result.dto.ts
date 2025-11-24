import { ApiProperty } from '@nestjs/swagger';
import { ErrorCodes } from '../constants/error-codes.constant';

/**
 * Standard API Response Structure
 */
export class Result<T = any> {
  @ApiProperty({ description: 'Response code', example: 'SUCCESS' })
  code: string;

  @ApiProperty({ description: 'Response message', example: 'Success' })
  message: string;

  @ApiProperty({ description: 'Response data' })
  data?: T;

  constructor(code: string, message: string, data?: T) {
    this.code = code;
    this.message = message;
    this.data = data;
  }

  /**
   * Create success response
   */
  static success<T>(data?: T): Result<T> {
    return new Result(ErrorCodes.SUCCESS.code, ErrorCodes.SUCCESS.message, data);
  }

  /**
   * Create error response
   */
  static error(code: string, message: string): Result<null> {
    return new Result(code, message, null);
  }

  /**
   * Create error response with message only (defaults to INTERNAL_SERVER_ERROR)
   */
  static errorMessage(message: string): Result<null> {
    return new Result(ErrorCodes.INTERNAL_SERVER_ERROR.code, message, null);
  }

  /**
   * Create custom response
   */
  static custom<T>(code: string, message: string, data?: T): Result<T> {
    return new Result(code, message, data);
  }
}

