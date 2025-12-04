# Global Response Format Implementation

This document describes the global response format implementation for all applications in the UMKM Tracker API monorepo.

## Overview

A shared library (`@app/shared`) has been created to provide consistent response formatting across all applications (seller, buyer, and admin).

## Response Formats

### Success Response

All successful API responses follow this format:

```json
{
  "status": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "timestamp": "2024-12-03T15:30:00.000Z"
}
```

**Fields:**
- `status` (boolean): Always `true` for successful responses
- `statusCode` (number): HTTP status code (200, 201, etc.)
- `message` (string): Success message
- `data` (object|array): Response payload
- `timestamp` (string): ISO 8601 timestamp with timezone

### Error Response

All error responses follow this format:

```json
{
  "status": false,
  "statusCode": 400,
  "message": "Error message",
  "timestamp": "2024-12-03T15:30:00.000Z"
}
```

**Fields:**
- `status` (boolean): Always `false` for error responses
- `statusCode` (number): HTTP error status code (400, 401, 404, 500, etc.)
- `message` (string): Error message
- `timestamp` (string): ISO 8601 timestamp with timezone

## Implementation Details

### Shared Library Structure

```
libs/shared/
├── src/
│   ├── interceptors/
│   │   └── response.interceptor.ts
│   ├── filters/
│   │   └── http-exception.filter.ts
│   ├── index.ts
│   └── shared.module.ts
├── tsconfig.lib.json
├── package.json
└── README.md
```

### Components

#### 1. ResponseInterceptor

Automatically wraps all successful responses in the standard format.

**Features:**
- Automatically adds `status`, `statusCode`, and `timestamp`
- Extracts custom messages from controller responses
- Preserves existing formatted responses
- Handles both object and array data

#### 2. HttpExceptionFilter

Catches all exceptions and formats them consistently.

**Features:**
- Handles HTTP exceptions
- Handles validation errors (joins array messages)
- Handles generic errors
- Provides appropriate status codes

### Applied to All Apps

The global response format has been implemented in:

1. **Seller App** (`apps/seller/main.ts`)
2. **Buyer App** (`apps/buyer/src/main.ts`)
3. **Admin App** (`apps/admin/src/main.ts`)

Each application's `main.ts` includes:

```typescript
import { ResponseInterceptor, HttpExceptionFilter } from '@app/shared';

// ...

app.useGlobalInterceptors(new ResponseInterceptor());
app.useGlobalFilters(new HttpExceptionFilter());
```

## Usage Examples

### Basic Controller Response

```typescript
@Get()
findAll() {
  return users; // Array or object
}
```

**Output:**
```json
{
  "status": true,
  "statusCode": 200,
  "message": "Success",
  "data": [...],
  "timestamp": "2024-12-03T15:30:00.000Z"
}
```

### Custom Message

```typescript
@Post()
create(@Body() dto: CreateDto) {
  const result = await this.service.create(dto);
  return {
    message: 'User created successfully',
    data: result
  };
}
```

**Output:**
```json
{
  "status": true,
  "statusCode": 201,
  "message": "User created successfully",
  "data": {...},
  "timestamp": "2024-12-03T15:30:00.000Z"
}
```

### Error Handling

```typescript
@Get(':id')
findOne(@Param('id') id: string) {
  const user = await this.service.findOne(id);
  if (!user) {
    throw new NotFoundException('User not found');
  }
  return user;
}
```

**Error Output:**
```json
{
  "status": false,
  "statusCode": 404,
  "message": "User not found",
  "timestamp": "2024-12-03T15:30:00.000Z"
}
```

### Validation Errors

```typescript
@Post()
create(@Body() dto: CreateDto) {
  // If validation fails
}
```

**Error Output:**
```json
{
  "status": false,
  "statusCode": 400,
  "message": "email must be an email, password must be longer than or equal to 6 characters",
  "timestamp": "2024-12-03T15:30:00.000Z"
}
```

## Configuration

### TypeScript Path Mapping

The shared library is accessible via the `@app/shared` alias, configured in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@app/shared": ["libs/shared/src"],
      "@app/shared/*": ["libs/shared/src/*"]
    }
  }
}
```

### NestJS Monorepo Configuration

The shared library is registered in `nest-cli.json`:

```json
{
  "projects": {
    "shared": {
      "type": "library",
      "root": "libs/shared",
      "entryFile": "index",
      "sourceRoot": "libs/shared/src"
    }
  }
}
```

## Testing

### Build All Apps

```bash
npm run build:seller
npm run build:buyer
npm run build:admin
```

### Start Individual Apps

```bash
npm run start:seller  # Port 3000
npm run start:buyer   # Port 3001
npm run start:admin   # Port 3002
```

### Test Endpoints

**Success Response:**
```bash
curl http://localhost:3000/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

**Error Response:**
```bash
curl http://localhost:3000/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid","password":"123"}'
```

## Benefits

1. **Consistency**: All APIs return responses in the same format
2. **Maintainability**: Single source of truth for response formatting
3. **Reusability**: Shared across all applications in the monorepo
4. **Type Safety**: TypeScript interfaces for response types
5. **Error Handling**: Centralized error formatting
6. **Timestamps**: Automatic timezone-aware timestamps
7. **Flexibility**: Easy to customize messages per endpoint

## Future Enhancements

Potential improvements:

1. Add request ID tracking
2. Add pagination metadata for list responses
3. Add response time metrics
4. Add localization support for messages
5. Add response compression
6. Add API versioning support

## Troubleshooting

### Import Errors

If you encounter import errors:

1. Ensure `tsconfig.json` has the correct path mappings
2. Rebuild the project: `npm run build`
3. Restart your IDE/editor

### Response Not Formatted

If responses aren't being formatted:

1. Check that interceptor and filter are registered in `main.ts`
2. Ensure they're registered before `app.listen()`
3. Check for conflicting interceptors/filters

### Build Errors

If build fails:

1. Check `nest-cli.json` configuration
2. Verify all TypeScript files are valid
3. Run `npm install` to ensure dependencies are installed

## Conclusion

The global response format is now implemented across all applications in the UMKM Tracker API monorepo. All endpoints automatically return responses in the standardized format, providing a consistent API experience for all consumers.
