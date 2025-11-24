import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { Response } from 'express';
import { BusinessException } from '../exceptions/business.exception';
import { Result } from '../dto/result.dto';

/**
 * Business Exception Filter
 * Catches BusinessException and formats response
 * HTTP status is determined from error definition
 */
@Catch(BusinessException)
export class BusinessExceptionFilter implements ExceptionFilter {
  catch(exception: BusinessException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const result = Result.error(exception.code, exception.message);

    response.status(exception.httpStatus).json(result);
  }
}

