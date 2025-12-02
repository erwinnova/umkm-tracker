# 🚀 Quick Start Guide - UMKM Tracker API

## ⚡ 5-Minute Setup

### 1. Install Dependencies (if not already done)

```bash
cd "D:\Private Project\umkm-tracker\umkm-tr-api"
npm install
```

### 2. Verify Environment Variables

The `.env` file is already created with:
```env
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h
```

⚠️ **For production**: Change `JWT_SECRET` to a strong, random value!

### 3. Start the Server

```bash
npm run start:dev
```

✅ You should see:
```
Application is running on: http://localhost:3000
```

## 🧪 Test in 2 Minutes

### Using PowerShell (Windows)

**1. Register a user:**
```powershell
$body = @{
    name = "John Doe"
    email = "john@example.com"
    password = "password123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/auth/register" -Method Post -ContentType "application/json" -Body $body
```

**2. Login:**
```powershell
$body = @{
    email = "john@example.com"
    password = "password123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/auth/login" -Method Post -ContentType "application/json" -Body $body
$token = $response.accessToken
```

**3. Get Profile:**
```powershell
$headers = @{ Authorization = "Bearer $token" }
Invoke-RestMethod -Uri "http://localhost:3000/users/profile" -Method Get -Headers $headers
```

### Using cURL

**1. Register:**
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"password123"}'
```

**2. Login:**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
```

**3. Get Profile (replace YOUR_TOKEN):**
```bash
curl -X GET http://localhost:3000/users/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📚 Documentation Files

- **API_TESTING_GUIDE.md** - Complete testing guide with all methods
- **IMPLEMENTATION_SUMMARY.md** - Technical implementation details
- **AUTHENTICATION_FLOW.md** - Visual flow diagrams
- **src/auth/README.md** - Authentication module documentation
- **test-auth.http** - VS Code REST Client tests
- **postman_collection.json** - Import into Postman

## 🎯 What You Can Do Now

### ✅ Working Features

1. **User Registration** - Create new accounts
2. **User Login** - Authenticate existing users
3. **JWT Authentication** - Secure token-based auth
4. **Protected Routes** - Access control with guards
5. **Password Security** - Bcrypt hashing
6. **Input Validation** - Automatic validation
7. **CORS Support** - Cross-origin requests enabled

### 🔒 API Endpoints

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/auth/register` | ❌ | Register new user |
| POST | `/auth/login` | ❌ | Login user |
| GET | `/users/profile` | ✅ | Get current user profile |

## 🛠️ Development Commands

```bash
# Start development server (with hot reload)
npm run start:dev

# Build for production
npm run build

# Start production server
npm run start:prod

# Run tests
npm run test

# Lint code
npm run lint

# Format code
npm run format
```

## 📊 Project Statistics

- **Total Files Created**: 35+ files
- **Modules**: 3 (App, Auth, Users)
- **Endpoints**: 3 (Register, Login, Profile)
- **Dependencies Added**: 10+ packages
- **Lines of Documentation**: 1000+

## 🎓 Learning Resources

If you're new to NestJS:

1. **NestJS Basics**: https://docs.nestjs.com/first-steps
2. **Authentication**: https://docs.nestjs.com/security/authentication
3. **Guards**: https://docs.nestjs.com/guards
4. **Validation**: https://docs.nestjs.com/techniques/validation

## ⚠️ Important Notes

### Current Implementation
- ✅ Ready for development and testing
- ⚠️ Using in-memory storage (data lost on restart)
- ⚠️ Not production-ready (needs database)

### Before Production
1. Add database (PostgreSQL/MongoDB)
2. Change JWT_SECRET to strong random value
3. Enable HTTPS
4. Add rate limiting
5. Add logging and monitoring
6. Add refresh tokens
7. Add email verification
8. Add comprehensive tests

## 🐛 Troubleshooting

### Server won't start?
```bash
# Check if port 3000 is in use
netstat -ano | findstr :3000

# Or change port in .env
PORT=3001
```

### Can't connect to API?
- Ensure server is running (`npm run start:dev`)
- Check firewall settings
- Verify URL is `http://localhost:3000`

### 401 Unauthorized errors?
- Check token is included in Authorization header
- Verify token format: `Bearer <token>`
- Token may have expired (24h default)

## 💡 Tips

1. **Use VS Code REST Client** - Open `test-auth.http` and click "Send Request"
2. **Import Postman Collection** - Use `postman_collection.json`
3. **Check Server Logs** - Watch terminal for errors and requests
4. **Token Auto-Save** - Postman collection saves tokens automatically

## 🎉 Success!

You now have a fully functional authentication API with:
- ✅ User registration and login
- ✅ JWT token authentication
- ✅ Password hashing
- ✅ Protected routes
- ✅ Input validation
- ✅ Comprehensive documentation

## 📞 Next Steps

1. **Test all endpoints** using the provided tools
2. **Read the documentation** to understand the implementation
3. **Add database integration** (recommended next step)
4. **Create UMKM management features** (add business logic)
5. **Add more features** (see IMPLEMENTATION_SUMMARY.md)

---

**Happy Coding! 🚀**

For detailed information, see:
- [API Testing Guide](./API_TESTING_GUIDE.md)
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md)
- [Authentication Flow](./AUTHENTICATION_FLOW.md)
