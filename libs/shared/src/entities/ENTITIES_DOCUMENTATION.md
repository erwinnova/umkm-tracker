# Entity Documentation

## Overview

This document describes the complete entity structure for the UMKM Tracker API monorepo using NestJS, TypeORM, and MariaDB.

## Architecture

### Entity Relationships

```
User (1) -----> (1) Seller
  ↓
  └─────────────> (1) Product
                     ↑
                     └─ (M) [relationship from Seller]
```

- **User → Seller**: One-to-One relationship (User owns a Seller profile)
- **Seller → Product**: One-to-Many relationship (Seller sells multiple Products)

### Key Features

✅ **UUID Primary Keys** - All entities use UUID for better distributed scalability  
✅ **Role-Based Access** - User enum supports ADMIN, SELLER, BUYER roles  
✅ **Spatial Data** - Seller includes MariaDB POINT geometry with SRID 4326  
✅ **Custom Transformer** - SpatialPointTransformer handles binary geometry conversion  
✅ **Explicit Foreign Keys** - All relations include explicit FK columns (e.g., `userId`, `sellerId`)  
✅ **Decimal Precision** - Product prices use DECIMAL(10,2) for accurate currency handling  
✅ **Performance Indexes** - Strategic indexes on frequently queried columns  
✅ **Strict TypeScript** - Fully typed with proper null handling

---

## Entities

### 1. User Entity

**File**: `user.entity.ts`

**Purpose**: Centralized authentication table for all users (admins, sellers, buyers)

**Columns**:

| Column        | Type         | Constraints             | Description                           |
| ------------- | ------------ | ----------------------- | ------------------------------------- |
| `id`          | UUID         | Primary Key             | Unique identifier                     |
| `email`       | VARCHAR(255) | UNIQUE, NOT NULL        | User email                            |
| `password`    | VARCHAR(255) | NOT NULL, select: false | Hashed password (excluded by default) |
| `fullName`    | VARCHAR(255) | NOT NULL                | User's full name                      |
| `phoneNumber` | VARCHAR(20)  | NULLABLE                | Contact number                        |
| `role`        | ENUM         | DEFAULT: BUYER          | User role: ADMIN, SELLER, BUYER       |
| `createdAt`   | TIMESTAMP    | NOT NULL                | Creation timestamp                    |
| `updatedAt`   | TIMESTAMP    | NOT NULL                | Last update timestamp                 |

**Relationships**:

- **OneToOne**: `seller` → Seller entity (inverse side)
  - Cascade delete/update enabled
  - Optional (nullable)

**Usage Example**:

```typescript
// Creating a seller user
const user = userRepository.create({
  email: 'seller@example.com',
  password: hashedPassword,
  fullName: 'John Doe',
  phoneNumber: '+62812345678',
  role: UserRole.SELLER,
});

// Query with password
const userWithPassword = await userRepository
  .createQueryBuilder('user')
  .addSelect('user.password')
  .where('user.email = :email', { email: 'seller@example.com' })
  .getOne();
```

---

### 2. Seller Entity

**File**: `seller.entity.ts`

**Purpose**: Business profile for sellers, includes location tracking and store information

**Columns**:

| Column         | Type              | Constraints            | Description                       |
| -------------- | ----------------- | ---------------------- | --------------------------------- |
| `id`           | UUID              | Primary Key            | Unique identifier                 |
| `userId`       | VARCHAR(36)       | Foreign Key (users.id) | Reference to User                 |
| `storeName`    | VARCHAR(255)      | NOT NULL               | Business/store name               |
| `description`  | TEXT              | NULLABLE               | Store description                 |
| `category`     | VARCHAR(100)      | NULLABLE               | Business category                 |
| `isOpen`       | BOOLEAN           | DEFAULT: false         | Operating status                  |
| `bannerUrl`    | VARCHAR(500)      | NULLABLE               | Store banner image URL            |
| `lastLocation` | POINT (SRID 4326) | NULLABLE               | **Spatial**: Last seller location |
| `createdAt`    | TIMESTAMP         | NOT NULL               | Creation timestamp                |
| `updatedAt`    | TIMESTAMP         | NOT NULL               | Last update timestamp             |

**Relationships**:

- **OneToOne**: `user` → User entity (owning side)
  - Join column: `user_id`
  - Cascade delete/update enabled
  - Required

- **OneToMany**: `products` → Product[] (owning side)
  - Cascade delete enabled
  - Optional

**Spatial Data (lastLocation)**:

- **Type**: POINT geometry with SRID 4326 (WGS84 - GPS coordinates)
- **Transformer**: SpatialPointTransformer
- **Format**: `{ latitude: number, longitude: number }`
- **Index**: Spatial index on `lastLocation` for geo-queries
- **Database Storage**: Binary WKB format (converted by transformer)

**Usage Example**:

```typescript
// Creating a seller
const seller = sellerRepository.create({
  userId: user.id,
  storeName: 'Fresh Mart',
  description: 'Quality groceries',
  category: 'Grocery',
  isOpen: true,
  bannerUrl: 'https://...',
  lastLocation: {
    latitude: -6.2088,
    longitude: 106.8456, // Jakarta coordinates
  },
});

// Query by location (near point)
const nearSellers = await sellerRepository.query(`
  SELECT * FROM sellers
  WHERE ST_Distance_Sphere(last_location, ST_PointFromText('POINT(106.8456 -6.2088)', 4326)) < 5000
`);
```

---

### 3. Product Entity

**File**: `product.entity.ts`

**Purpose**: Products/items sold by sellers

**Columns**:

| Column        | Type          | Constraints              | Description                 |
| ------------- | ------------- | ------------------------ | --------------------------- |
| `id`          | UUID          | Primary Key              | Unique identifier           |
| `sellerId`    | VARCHAR(36)   | Foreign Key (sellers.id) | Reference to Seller         |
| `name`        | VARCHAR(255)  | NOT NULL                 | Product name                |
| `price`       | DECIMAL(10,2) | NOT NULL                 | Price with 2 decimal places |
| `imageUrl`    | VARCHAR(500)  | NULLABLE                 | Product image URL           |
| `isAvailable` | BOOLEAN       | DEFAULT: true            | Availability status         |
| `description` | TEXT          | NULLABLE                 | Product description         |
| `createdAt`   | TIMESTAMP     | NOT NULL                 | Creation timestamp          |
| `updatedAt`   | TIMESTAMP     | NOT NULL                 | Last update timestamp       |

**Relationships**:

- **ManyToOne**: `seller` → Seller entity
  - Join column: `seller_id`
  - Cascade delete/update enabled
  - Required

**Indexes**:

- `idx_product_seller_id` - Fast product lookup by seller
- `idx_product_is_available` - Filter available products
- `idx_product_created_at` - Sort by creation date

**Price Handling**:

- Stored as DECIMAL(10,2) for precision
- Transformer converts string from DB to number
- Max value: 99,999,999.99
- Min value: 0.01

**Usage Example**:

```typescript
// Creating a product
const product = productRepository.create({
  sellerId: seller.id,
  name: 'Organic Tomato',
  price: 25000.5,
  imageUrl: 'https://...',
  isAvailable: true,
  description: 'Fresh organic tomatoes',
});

// Query available products by seller
const products = await productRepository.find({
  where: {
    sellerId: seller.id,
    isAvailable: true,
  },
  order: { createdAt: 'DESC' },
});

// Access related seller
const productWithSeller = await productRepository.findOne({
  where: { id: product.id },
  relations: ['seller', 'seller.user'],
});
```

---

## Spatial Transformer

**File**: `spatial.transformer.ts`

### Purpose

Handles conversion between MariaDB's binary POINT geometry format and JavaScript objects for seamless CRUD operations.

### Point Interface

```typescript
interface Point {
  latitude: number;
  longitude: number;
}
```

### Conversion Flow

```
Database (Binary WKB) ↔ Transformer ↔ Application (Object)
```

**From DB (Binary) → App (Object)**:

```typescript
// Binary WKB in database
Buffer: [01, 00, 00, 00, E6, 10, 00, 00, ...]
  ↓
// Parsed as Point
{ latitude: -6.2088, longitude: 106.8456 }
```

**To DB (Object → WKT/Binary)**:

```typescript
// Application value
{ latitude: -6.2088, longitude: 106.8456 }
  ↓
// Converts to WKT for database
"POINT(106.8456 -6.2088)"
  ↓
// Stored as binary geometry
```

### Implementation Details

- **WKB Parser**: Reads double-precision IEEE 754 floats from binary buffer
- **WKT Format**: Uses standard Well-Known Text format for strings
- **SRID 4326**: GPS coordinate system (latitude/longitude)
- **Error Handling**: Graceful fallback to (0, 0) on parse errors

---

## Enums

### UserRole

```typescript
enum UserRole {
  ADMIN = 'ADMIN', // Administrator with full access
  SELLER = 'SELLER', // Business owner/seller
  BUYER = 'BUYER', // Customer/buyer (default)
}
```

---

## Migration Integration

These entities work seamlessly with the migration system in `libs/shared/src/migrations`:

```bash
# Generate migration from entities
npx typeorm migration:generate -d libs/shared/src/migrations/migration.config.ts AddSellerAndProduct

# Run migrations
npm run migration:run
```

---

## Database Schema

### Users Table

```sql
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20),
  role ENUM('ADMIN', 'SELLER', 'BUYER') DEFAULT 'BUYER',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_users_email (email)
);
```

### Sellers Table

```sql
CREATE TABLE sellers (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) UNIQUE NOT NULL,
  store_name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  is_open BOOLEAN DEFAULT FALSE,
  banner_url VARCHAR(500),
  last_location POINT SRID 4326,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_seller_user_id (user_id),
  SPATIAL KEY idx_seller_last_location (last_location),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Products Table

```sql
CREATE TABLE products (
  id VARCHAR(36) PRIMARY KEY,
  seller_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  image_url VARCHAR(500),
  is_available BOOLEAN DEFAULT TRUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_product_seller_id (seller_id),
  KEY idx_product_is_available (is_available),
  KEY idx_product_created_at (created_at),
  FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE
);
```

---

## Best Practices

### 1. Query Patterns

**Load related data efficiently**:

```typescript
const seller = await sellerRepository.findOne({
  where: { id: sellerId },
  relations: ['user', 'products'],
});
```

**Exclude password by default**:

```typescript
const user = await userRepository.findOne({
  where: { email },
  // password excluded automatically
});

// Include password when needed
const userWithPassword = await userRepository
  .createQueryBuilder('user')
  .addSelect('user.password')
  .where('user.email = :email', { email })
  .getOne();
```

### 2. Spatial Queries

**Find sellers near a location**:

```typescript
const nearSellers = await sellerRepository.query(
  `
  SELECT s.*, 
    ST_Distance_Sphere(s.last_location, 
      ST_PointFromText('POINT(${lng} ${lat})', 4326)
    ) as distance
  FROM sellers s
  WHERE ST_Distance_Sphere(s.last_location, 
    ST_PointFromText('POINT(${lng} ${lat})', 4326)
  ) < ?
  ORDER BY distance
`,
  [distanceMeters],
);
```

### 3. Price Handling

**Always use numeric operations**:

```typescript
// Good
const totalPrice = products.reduce(
  (sum, p) => sum + parseFloat(p.price as string),
  0,
);

// With transformer, automatically converted
const price: number = product.price; // Already a number
```

---

## Import Usage

```typescript
// Import all entities
import {
  User,
  UserRole,
  Seller,
  Product,
  Point,
  SpatialPointTransformer,
} from '@app/shared/entities';

// Use in module
@Module({
  imports: [TypeOrmModule.forFeature([User, Seller, Product])],
})
export class YourModule {}
```

---

## Summary

| Entity          | Purpose          | Key Feature               |
| --------------- | ---------------- | ------------------------- |
| **User**        | Authentication   | Role-based access control |
| **Seller**      | Business profile | GPS location tracking     |
| **Product**     | Inventory        | Precise decimal pricing   |
| **Transformer** | Data conversion  | MariaDB spatial handling  |

All entities are production-ready with proper TypeScript types, relationships, and optimizations.
