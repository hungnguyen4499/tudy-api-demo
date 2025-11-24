import { HttpException } from '@nestjs/common';
import { IErrorCode } from '../constants/error-codes.constant';

/**
 * Business Exception
 * Accepts IErrorCode definition and optionally overrides message
 * HTTP status is taken from error code definition
 */
export class BusinessException extends HttpException {
  public readonly code: string;
  public readonly message: string;
  public readonly httpStatus: number;

  constructor(errorCode: IErrorCode, messageOverride?: string) {
    const { code, message, httpStatus } = errorCode;
    const finalMessage = messageOverride || message;

    super({ code, message: finalMessage }, httpStatus);

    this.code = code;
    this.message = finalMessage;
    this.httpStatus = httpStatus;
  }
}

