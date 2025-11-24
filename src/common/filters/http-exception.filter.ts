import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { Result } from '../dto/result.dto';

/**
 * HTTP Exception Filter
 * Catches all HttpException and formats response
 * Defaults to INTERNAL_SERVER_ERROR (500) if no code provided
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse: any = exception.getResponse();

    // Handle validation errors
    if (status === HttpStatus.BAD_REQUEST && exceptionResponse.message) {
      const message = Array.isArray(exceptionResponse.message)
        ? exceptionResponse.message.join(', ')
        : exceptionResponse.message;

      const result = Result.errorMessage(message);
      response.status(status).json(result);
      return;
    }

    // Handle other HTTP exceptions
    const message =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : exceptionResponse.message || 'Internal server error';

    // Default to INTERNAL_SERVER_ERROR (500) if no code provided
    const result = Result.errorMessage(message);
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json(result);
  }
}

