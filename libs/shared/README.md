# Shared Library

This library contains shared components used across all applications in the monorepo.

## Components

### Response Interceptor

The `ResponseInterceptor` automatically formats all successful API responses with a consistent structure.

**Success Response Format:**
```json
{
  "status": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### HTTP Exception Filter

The `HttpExceptionFilter` catches all exceptions and formats error responses consistently.

**Error Response Format:**
```json
{
  "status": false,
  "statusCode": 400,
  "message": "Error message",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Usage

### Import in your application

```typescript
import { ResponseInterceptor, HttpExceptionFilter } from '@app/shared';
```

### Apply globally in main.ts

```typescript
import { NestFactory } from '@nestjs/core';
import { ResponseInterceptor, HttpExceptionFilter } from '@app/shared';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable global response formatting
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(3000);
}
bootstrap();
```

## Custom Response Messages

You can customize the response message by returning an object with a `message` property:

```typescript
@Get()
findAll() {
  return {
    message: 'Users retrieved successfully',
    data: users
  };
}
```

This will produce:
```json
{
  "status": true,
  "statusCode": 200,
  "message": "Users retrieved successfully",
  "data": [...],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Error Handling

The filter automatically handles:
- HTTP exceptions
- Validation errors (arrays of messages are joined)
- Generic errors

Example:
```typescript
throw new BadRequestException('Invalid input');
```

Produces:
```json
{
  "status": false,
  "statusCode": 400,
  "message": "Invalid input",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```
