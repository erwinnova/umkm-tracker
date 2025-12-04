import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  status: boolean;
  statusCode: number;
  message: string;
  data?: T;
  timestamp: string;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    return next.handle().pipe(
      map((data) => {
        const statusCode = response.statusCode || 200;
        
        // If data already has the response format, return it as is
        if (data && typeof data === 'object' && 'status' in data && 'statusCode' in data) {
          return data;
        }

        // Extract message if provided in data
        let message = 'Success';
        let responseData = data;

        if (data && typeof data === 'object' && 'message' in data) {
          message = data.message;
          responseData = data.data !== undefined ? data.data : data;
        }

        return {
          status: true,
          statusCode,
          message,
          data: responseData,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}