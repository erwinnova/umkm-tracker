# Code Quality, Clean Code & Performance Recommendations

## Executive Summary

Your UMKM Tracker API is well-structured with a good foundation, but there are several opportunities for improvement in code quality, clean code practices, and performance optimization. This document provides actionable recommendations across multiple areas.

---

## 1. CRITICAL ISSUES 🔴

### 1.1 Security: Hardcoded JWT Secret

**File**: `apps/seller/auth/auth.module.ts`, `apps/seller/auth/strategies/jwt.strategy.ts`

**Issue**: Default JWT secret is hardcoded for development fallback

```typescript
// ❌ Current - SECURITY RISK
secret: configService.get<string>('JWT_SECRET') ||
  'your-secret-key-change-in-production';
```

**Impact**:

- Production vulnerability if env variable is missing
- Security risk for token validation
- Violates OWASP guidelines

**Recommendation**:

```typescript
// ✅ Better
const jwtSecret = configService.get<string>('JWT_SECRET');
if (!jwtSecret && configService.get('NODE_ENV') === 'production') {
  throw new Error('JWT_SECRET environment variable is required in production');
}

secret: jwtSecret || generateSecureRandomString();
```

---

### 1.2 Password Exposure in Response

**File**: `apps/seller/users/users.controller.ts`

**Issue**: Password field returned from database query before filtering

```typescript
// ⚠️ Current - Manual exclusion is error-prone
const { password, ...userWithoutPassword } = user;
```

**Better Approach**: Use database-level field exclusion

**Recommendation**:

```typescript
// ✅ Better - Use select: false in entity
@Column({ select: false })
password: string;

// Or use query builder
const user = await this.userRepository
  .createQueryBuilder('user')
  .select('user.id', 'id')
  .select('user.email', 'email')
  .select('user.name', 'name')
  .where('user.id = :id', { id: userId })
  .getOne();
```

---

### 1.3 Missing Input Validation on Password Strength

**File**: `apps/seller/auth/dto/register.dto.ts`

**Issue**: Password validation is minimal (only length)

```typescript
// ⚠️ Current
@MinLength(6)
@MaxLength(50)
password: string;
```

**Recommendation**:

```typescript
// ✅ Better - Add strength validation
@Matches(
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
  {
    message: 'Password must contain uppercase, lowercase, number, and special character'
  }
)
@MinLength(8)
password: string;
```

---

## 2. CODE QUALITY ISSUES 🟠

### 2.1 Type Safety: Excessive use of `any`

**Files**: Multiple files using `any` type

**Current State**: ESLint rule disabled

```javascript
// ❌ Current - Rule disabled
'@typescript-eslint/no-explicit-any': 'off'
```

**Issues**:

- Loss of type safety
- Harder to catch bugs at compile time
- Poor IDE autocomplete support

**Recommendation**:

```typescript
// ✅ Example fix in jwt.strategy.ts
async validate(payload: JwtPayload) {  // Instead of payload: any
  const user = await this.authService.validateUser(payload.sub);
  if (!user) {
    throw new UnauthorizedException('User not found');
  }
  return { userId: payload.sub, email: payload.email };
}

// Create a JwtPayload interface
export interface JwtPayload {
  sub: string;
  email: string;
  iat?: number;
  exp?: number;
}
```

### 2.2 Missing Error Handling in Controller

**File**: `apps/seller/users/users.controller.ts`

**Issue**: Returns plain message object instead of proper exception

```typescript
// ❌ Current
if (!user) {
  return { message: 'User not found' }; // Wrong! Should throw exception
}
```

**Recommendation**:

```typescript
// ✅ Better
import { NotFoundException } from '@nestjs/common';

if (!user) {
  throw new NotFoundException('User not found');
}
```

### 2.3 ResponseInterceptor Logic is Too Complex

**File**: `libs/shared/src/interceptors/response.interceptor.ts`

**Issue**: Logic tries to handle multiple response formats, making it fragile

**Recommendation**: Standardize response format across entire application

```typescript
// ✅ Better
export interface ApiResponse<T = any> {
  status: boolean;
  statusCode: number;
  message: string;
  data?: T;
  timestamp: string;
}

export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();

    return next.handle().pipe(
      map((data) => ({
        status: true,
        statusCode: response.statusCode || 200,
        message: data?.message || 'Success',
        data: data?.data || data,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
```

### 2.4 Hardcoded bcrypt Salt Rounds

**File**: `apps/seller/auth/auth.service.ts`

**Issue**: Magic number in code

```typescript
// ⚠️ Current
const saltRounds = 10;
```

**Recommendation**:

```typescript
// ✅ Better - Make it configurable
private readonly BCRYPT_SALT_ROUNDS =
  this.configService.get<number>('BCRYPT_SALT_ROUNDS') || 10;

async register(registerDto: RegisterDto) {
  const hashedPassword = await bcrypt.hash(
    password,
    this.BCRYPT_SALT_ROUNDS
  );
}
```

---

## 3. CLEAN CODE VIOLATIONS 🟡

### 3.1 Unused Guard Logic

**File**: `apps/seller/auth/guards/jwt-auth.guard.ts`

**Issue**: Guard doesn't add any value

```typescript
// ⚠️ Current - Pointless override
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    return super.canActivate(context); // Just calls parent
  }
}
```

**Recommendation**: Remove it and use `AuthGuard('jwt')` directly

```typescript
// ✅ Better - Use directly in controllers
@UseGuards(AuthGuard('jwt'))
@Get('profile')
async getProfile(@Request() req) {
  // ...
}
```

Or only keep if you add custom logic:

```typescript
// ✅ If keeping guard, add real logic
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isAuthenticated = await super.canActivate(context);

    // Add rate limiting, logging, or other checks here
    const request = context.switchToHttp().getRequest();
    console.log(`[Auth] User ${request.user?.email} accessed endpoint`);

    return isAuthenticated as boolean;
  }
}
```

### 3.2 Placeholder Service Methods

**File**: `apps/seller/app.service.ts`

**Issue**: Meaningless placeholder

```typescript
// ⚠️ Current
getHello(): string {
  return 'Hello World!';
}
```

**Recommendation**: Either remove or replace with actual health check

```typescript
// ✅ Better - Real health check
import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class AppService {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async getHealthCheck(): Promise<{ status: string; database: boolean }> {
    try {
      await this.dataSource.query('SELECT 1');
      return { status: 'healthy', database: true };
    } catch {
      return { status: 'unhealthy', database: false };
    }
  }
}

// In controller
@Get('health')
async getHealth() {
  return this.appService.getHealthCheck();
}
```

### 3.3 Inconsistent Error Response Format

**File**: `apps/seller/users/users.controller.ts`

**Issue**: Different success response format than standardized interceptor

```typescript
// ⚠️ Inconsistent
const { password, ...userWithoutPassword } = user;
return userWithoutPassword; // Missing standardized format
```

---

## 4. PERFORMANCE ISSUES ⚡

### 4.1 N+1 Query Problem Risk in Users Service

**File**: `apps/seller/users/users.service.ts`

**Current Issue**: If User entity has relations (future relations), they could be loaded inefficiently

**Recommendation**: Add explicit query builder methods

```typescript
// ✅ Better - Explicit field selection
async findByEmailWithoutPassword(email: string): Promise<Omit<User, 'password'> | null> {
  return await this.userRepository
    .createQueryBuilder('user')
    .select(['user.id', 'user.email', 'user.name', 'user.createdAt', 'user.updatedAt'])
    .where('user.email = :email', { email })
    .getOne();
}

async findByIdWithoutPassword(id: string): Promise<Omit<User, 'password'> | null> {
  return await this.userRepository
    .createQueryBuilder('user')
    .select(['user.id', 'user.email', 'user.name', 'user.createdAt', 'user.updatedAt'])
    .where('user.id = :id', { id })
    .getOne();
}
```

### 4.2 Missing Database Indexes

**File**: `apps/seller/users/entities/user.entity.ts`

**Issue**: Email lookups happen frequently but might not be indexed efficiently

**Recommendation**:

```typescript
// ✅ Better
@Entity('users')
@Index('idx_email', ['email']) // Index on frequently queried field
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index() // Unique constraint creates index anyway
  email: string;

  @Column()
  password: string;

  @Column()
  name: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

### 4.3 No Pagination for User List

**File**: `apps/seller/users/users.service.ts`

**Issue**: `findAll()` loads all users into memory

```typescript
// ⚠️ Potential issue
async findAll(): Promise<User[]> {
  return await this.userRepository.find();
}
```

**Recommendation**: Add pagination

```typescript
// ✅ Better
async findAll(page: number = 1, limit: number = 10): Promise<{ users: User[]; total: number }> {
  const [users, total] = await this.userRepository.findAndCount({
    skip: (page - 1) * limit,
    take: limit,
    order: { createdAt: 'DESC' },
  });

  return { users, total };
}
```

### 4.4 Synchronous Operations in Async Context

**File**: `apps/seller/auth/auth.service.ts`

**Issue**: Response object manipulation happens after async operations but could be optimized

**Recommendation**: Use constants for response structure

```typescript
// ✅ Better
private formatAuthResponse(user: User, accessToken: string, message: string) {
  const { password, ...safeUser } = user;
  return {
    message,
    user: safeUser,
    accessToken,
  };
}

async register(registerDto: RegisterDto) {
  // ... existing code ...
  return this.formatAuthResponse(user, accessToken, 'User registered successfully');
}
```

### 4.5 Missing Database Connection Pooling Configuration

**File**: `apps/seller/app.module.ts`

**Issue**: No connection pool configuration

```typescript
// ⚠️ Current - Using defaults
TypeOrmModule.forRootAsync({
  useFactory: (configService: ConfigService) => ({
    type: 'postgres',
    // ... other config ...
  }),
});
```

**Recommendation**: Add connection pool settings

```typescript
// ✅ Better
TypeOrmModule.forRootAsync({
  useFactory: (configService: ConfigService) => ({
    type: 'postgres',
    host: configService.get('DB_HOST'),
    port: configService.get('DB_PORT'),
    username: configService.get('DB_USERNAME'),
    password: configService.get('DB_PASSWORD'),
    database: configService.get('DB_NAME'),
    entities: [__dirname + '/**/*.entity{.ts,.js}'],
    logging: configService.get('NODE_ENV') === 'development',
    autoLoadEntities: true,
    pool: {
      min: 2,
      max: 10, // Configurable via env
    },
    poolErrorHandler: (err: Error) => {
      console.error('Unexpected error on idle client', err);
    },
    connectTimeoutMS: 10000,
  }),
});
```

---

## 5. TESTING GAPS 🧪

### 5.1 Minimal Test Coverage

**File**: `apps/seller/app.controller.spec.ts`

**Issue**: Only basic controller test exists, no:

- Auth service tests
- Users service tests
- Integration tests
- Error handling tests

**Recommendation**: Add comprehensive tests

```typescript
// ✅ Example - Auth service tests
describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            create: jest.fn(),
            findById: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('register', () => {
    it('should throw ConflictException if user exists', async () => {
      jest
        .spyOn(usersService, 'findByEmail')
        .mockResolvedValue({ id: '1' } as any);

      await expect(
        service.register({
          email: 'test@example.com',
          password: 'Test@1234',
          name: 'Test',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should hash password before saving', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'Test@1234',
        name: 'Test',
      };
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(null);
      jest.spyOn(usersService, 'create').mockResolvedValue({ id: '1' } as any);
      jest.spyOn(jwtService, 'sign').mockReturnValue('token');

      await service.register(registerDto);

      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: registerDto.email,
          password: expect.not.stringContaining(registerDto.password), // Hashed
        }),
      );
    });
  });
});
```

---

## 6. CONFIGURATION & DEPLOYMENT 🔧

### 6.1 Missing Environment Variables Validation

**Issue**: No validation of required env variables at startup

**Recommendation**: Create configuration validation

```typescript
// ✅ Better - config/database.config.ts
import { registerAs } from '@nestjs/config';
import { ClassConstructor, plainToInstance } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsOptional,
  ValidateIf,
  validate,
} from 'class-validator';

class DatabaseConfig {
  @IsNotEmpty()
  @IsString()
  DB_HOST: string;

  @IsNotEmpty()
  @IsNumber()
  DB_PORT: number;

  @IsNotEmpty()
  @IsString()
  DB_USERNAME: string;

  @IsNotEmpty()
  @IsString()
  DB_PASSWORD: string;

  @IsNotEmpty()
  @IsString()
  DB_NAME: string;

  @IsOptional()
  @IsString()
  NODE_ENV: string;
}

export const validateDatabaseConfig = async () => {
  const config = plainToInstance(DatabaseConfig, process.env);
  const errors = await validate(config, { skipMissingProperties: false });

  if (errors.length > 0) {
    throw new Error(`Database config validation failed: ${errors}`);
  }

  return config;
};

// Usage in app.module.ts
validateDatabaseConfig().then(() => {
  // Start app
});
```

### 6.2 No Health Check Endpoint

**Issue**: No built-in health checks for orchestration/load balancers

**Recommendation**: Add Terminus health checks

```typescript
// ✅ Better - Install @nestjs/terminus
npm install @nestjs/terminus

// health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, DatabaseHealthIndicator } from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: DatabaseHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
    ]);
  }
}
```

---

## 7. LOGGING & MONITORING 📊

### 7.1 Minimal Logging

**Issue**: Limited logging for debugging and monitoring

**Recommendation**: Add structured logging

```typescript
// ✅ Better - Install winston
npm install winston nestjs-winston

// Configure in app.module.ts
import { WinstonModule } from 'nestjs-winston';
import * as winston from 'winston';

const logger = WinstonModule.createLogger({
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
          return `${timestamp} [${level}]: ${message}`;
        }),
      ),
    }),
    new winston.transports.File({
      filename: 'error.log',
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),
  ],
});

// Use in services
constructor(private logger: Logger) {}

async register(registerDto: RegisterDto) {
  this.logger.log(`User registration attempt for email: ${registerDto.email}`);
  // ...
}
```

---

## 8. DOCUMENTATION 📝

### 8.1 Missing API Documentation

**Issue**: No API docs (Swagger/OpenAPI)

**Recommendation**: Add Swagger

```typescript
// ✅ Better - Install @nestjs/swagger
npm install @nestjs/swagger swagger-ui-express

// main.ts
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

const config = new DocumentBuilder()
  .setTitle('UMKM Tracker API')
  .setDescription('API for managing UMKM businesses')
  .setVersion('1.0')
  .addBearerAuth()
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api/docs', app, document);

// In controllers
@Post('register')
@ApiOperation({ summary: 'Register a new user' })
@ApiResponse({ status: 201, description: 'User registered successfully' })
@ApiResponse({ status: 409, description: 'User already exists' })
async register(@Body() registerDto: RegisterDto) {
  // ...
}
```

---

## PRIORITY ACTION ITEMS

| Priority | Issue                             | Effort  | Impact   |
| -------- | --------------------------------- | ------- | -------- |
| 🔴 P0    | Fix JWT secret security           | 15 min  | CRITICAL |
| 🔴 P0    | Remove `any` type usage           | 1-2 hrs | HIGH     |
| 🔴 P0    | Add password strength validation  | 30 min  | HIGH     |
| 🟠 P1    | Add error handling to controllers | 1 hr    | MEDIUM   |
| 🟠 P1    | Add pagination to user list       | 30 min  | MEDIUM   |
| 🟠 P1    | Add database connection pooling   | 20 min  | MEDIUM   |
| 🟡 P2    | Add comprehensive tests           | 4-6 hrs | MEDIUM   |
| 🟡 P2    | Add health check endpoint         | 30 min  | LOW      |
| 🟡 P2    | Add Swagger documentation         | 1-2 hrs | LOW      |
| 🟡 P2    | Remove unused JwtAuthGuard        | 15 min  | LOW      |

---

## SUMMARY

**Strengths:**

- ✅ Good monorepo structure
- ✅ Shared library pattern for cross-app consistency
- ✅ Proper use of TypeORM
- ✅ Global interceptors and filters

**Areas to Improve:**

- 🔧 Security hardening (JWT secret, password validation)
- 🔧 Type safety (reduce `any` usage)
- 🔧 Error handling consistency
- 🔧 Database optimization (indexes, pooling)
- 🔧 Test coverage
- 🔧 Logging and monitoring

Your project has a solid foundation. By addressing the Priority 0 items, you'll significantly improve security and code quality. The remaining items will enhance maintainability and scalability.
