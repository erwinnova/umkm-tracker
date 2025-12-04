# Authentication Module

This module provides user authentication with JWT tokens for the UMKM Tracker API.

## Features

- User Registration
- User Login
- JWT Token Authentication
- Password Hashing (bcrypt)
- Protected Routes with Guards

## API Endpoints

### 1. Register User

**POST** `/auth/register`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (201 Created):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "1",
    "email": "john@example.com",
    "name": "John Doe"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Validation Rules:**
- `name`: Required, max 100 characters
- `email`: Required, valid email format
- `password`: Required, minimum 6 characters, max 50 characters

**Error Responses:**
- `409 Conflict`: User with this email already exists
- `400 Bad Request`: Validation errors

---

### 2. Login User

**POST** `/auth/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "message": "Login successful",
  "user": {
    "id": "1",
    "email": "john@example.com",
    "name": "John Doe"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid credentials
- `400 Bad Request`: Validation errors

---

### 3. Get User Profile (Protected)

**GET** `/users/profile`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Response (200 OK):**
```json
{
  "id": "1",
  "email": "john@example.com",
  "name": "John Doe",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid token

---

## Using Authentication in Your Routes

To protect a route with JWT authentication, use the `AuthGuard`:

```typescript
import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Controller('protected')
export class ProtectedController {
  @UseGuards(AuthGuard('jwt'))
  @Get()
  getProtectedData(@Request() req) {
    // Access user info from req.user
    console.log(req.user); // { userId: '1', email: 'john@example.com' }
    return { message: 'This is protected data' };
  }
}
```

## Environment Variables

Required environment variables in `.env`:

```env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h
```

## Security Notes

⚠️ **Important for Production:**

1. **Change JWT_SECRET**: Use a strong, random secret key
2. **Use HTTPS**: Always use HTTPS in production
3. **Database**: Replace in-memory storage with a real database (PostgreSQL, MongoDB, etc.)
4. **Password Policy**: Consider adding stronger password requirements
5. **Rate Limiting**: Add rate limiting to prevent brute force attacks
6. **Refresh Tokens**: Consider implementing refresh token mechanism
7. **Email Verification**: Add email verification for new registrations

## Testing with cURL

**Register:**
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"password123"}'
```

**Login:**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
```

**Get Profile (replace TOKEN with actual token):**
```bash
curl -X GET http://localhost:3000/users/profile \
  -H "Authorization: Bearer TOKEN"
```

## Testing with Postman

1. **Register/Login**: Use POST requests with JSON body
2. **Get Profile**: 
   - Add Authorization header
   - Type: Bearer Token
   - Token: <paste-your-token-here>
