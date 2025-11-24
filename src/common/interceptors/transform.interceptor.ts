import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Result } from '../dto/result.dto';

/**
 * Transform Interceptor
 * Automatically wraps response data in Result format
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Result<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Result<T>> {
    return next.handle().pipe(
      map((data) => {
        // If already Result format, return as is
        if (data instanceof Result) {
          return data;
        }

        // Wrap in Result
        return Result.success(data);
      }),
    );
  }
}

