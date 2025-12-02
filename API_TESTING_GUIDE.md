# UMKM Tracker API - Testing Guide

## 🚀 Getting Started

The API is running at: `http://localhost:3000`

## 📋 Available Endpoints

### Public Endpoints (No Authentication Required)

1. **GET** `/` - Health check
2. **POST** `/auth/register` - Register new user
3. **POST** `/auth/login` - Login user

### Protected Endpoints (Requires JWT Token)

1. **GET** `/users/profile` - Get current user profile

---

## 🧪 Testing Methods

### Method 1: Using cURL (Command Line)

#### 1. Register a New User

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Expected Response:**
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

#### 2. Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

#### 3. Get Profile (Replace YOUR_TOKEN with actual token)

```bash
curl -X GET http://localhost:3000/users/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### Method 2: Using PowerShell

#### 1. Register a New User

```powershell
$body = @{
    name = "John Doe"
    email = "john@example.com"
    password = "password123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/auth/register" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body
```

#### 2. Login

```powershell
$body = @{
    email = "john@example.com"
    password = "password123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/auth/login" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body

# Save the token
$token = $response.accessToken
Write-Host "Token: $token"
```

#### 3. Get Profile

```powershell
$headers = @{
    Authorization = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:3000/users/profile" `
  -Method Get `
  -Headers $headers
```

---

### Method 3: Using Postman

#### Setup:
1. Download and install [Postman](https://www.postman.com/downloads/)
2. Create a new Collection named "UMKM Tracker API"

#### 1. Register Request
- **Method**: POST
- **URL**: `http://localhost:3000/auth/register`
- **Headers**: 
  - `Content-Type: application/json`
- **Body** (raw JSON):
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

#### 2. Login Request
- **Method**: POST
- **URL**: `http://localhost:3000/auth/login`
- **Headers**: 
  - `Content-Type: application/json`
- **Body** (raw JSON):
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```
- **After Success**: Copy the `accessToken` from response

#### 3. Get Profile Request
- **Method**: GET
- **URL**: `http://localhost:3000/users/profile`
- **Authorization**:
  - Type: `Bearer Token`
  - Token: `<paste-your-token-here>`

---

### Method 4: Using VS Code REST Client Extension

1. Install "REST Client" extension in VS Code
2. Open the `test-auth.http` file
3. Click "Send Request" above each request
4. After login, copy the token and replace `@token` variable at the top

---

## 🔍 Testing Scenarios

### ✅ Success Cases

1. **Register new user** → Should return 201 with user data and token
2. **Login with correct credentials** → Should return 200 with user data and token
3. **Access protected route with valid token** → Should return 200 with user profile

### ❌ Error Cases

1. **Register with existing email**
   - Expected: 409 Conflict
   - Message: "User with this email already exists"

2. **Register with invalid email format**
   - Expected: 400 Bad Request
   - Message: "Invalid email format"

3. **Register with short password (< 6 chars)**
   - Expected: 400 Bad Request
   - Message: "Password must be at least 6 characters long"

4. **Login with wrong password**
   - Expected: 401 Unauthorized
   - Message: "Invalid credentials"

5. **Login with non-existent email**
   - Expected: 401 Unauthorized
   - Message: "Invalid credentials"

6. **Access protected route without token**
   - Expected: 401 Unauthorized

7. **Access protected route with invalid token**
   - Expected: 401 Unauthorized

---

## 📊 Sample Test Flow

```bash
# 1. Register first user
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com","password":"password123"}'

# 2. Register second user
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Bob","email":"bob@example.com","password":"password456"}'

# 3. Login as Alice
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"password123"}'

# 4. Copy the accessToken from response

# 5. Get Alice's profile
curl -X GET http://localhost:3000/users/profile \
  -H "Authorization: Bearer <ALICE_TOKEN>"

# 6. Try to register with Alice's email again (should fail)
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice Clone","email":"alice@example.com","password":"password789"}'
```

---

## 🔐 Security Notes

- Passwords are hashed using bcrypt before storage
- JWT tokens expire after 24 hours (configurable)
- Tokens are validated on every protected route access
- User passwords are never returned in API responses

---

## 🐛 Troubleshooting

### Problem: "Cannot connect to server"
**Solution**: Make sure the server is running:
```bash
npm run start:dev
```

### Problem: "401 Unauthorized" on protected routes
**Solution**: 
1. Make sure you're including the token in the Authorization header
2. Format: `Authorization: Bearer <your-token>`
3. Check if token hasn't expired (24h default)

### Problem: "409 Conflict" when registering
**Solution**: User with that email already exists. Use a different email or login instead.

---

## 📝 Next Steps

After testing authentication, you can:

1. Add password reset functionality
2. Implement email verification
3. Add refresh token mechanism
4. Create UMKM management endpoints
5. Add role-based access control (admin/user)
6. Integrate with a real database (PostgreSQL/MongoDB)

---

## 📞 Support

If you encounter any issues, check:
1. Server logs in the terminal
2. Environment variables in `.env` file
3. JWT_SECRET is properly set
