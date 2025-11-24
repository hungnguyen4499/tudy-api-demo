import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { Result } from '../dto/result.dto';

/**
 * All Exceptions Filter
 * Catches all unhandled exceptions
 * Defaults to INTERNAL_SERVER_ERROR (500) if no code provided
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      const exceptionResponse: any = exception.getResponse();
      message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : exceptionResponse.message || message;
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // Log error
    this.logger.error(
      `${request.method} ${request.url} - ${HttpStatus.INTERNAL_SERVER_ERROR} - ${message}`,
      exception instanceof Error ? exception.stack : '',
    );

    // Default to INTERNAL_SERVER_ERROR (500) if no code provided
    const result = Result.errorMessage(message);
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json(result);
  }
}

