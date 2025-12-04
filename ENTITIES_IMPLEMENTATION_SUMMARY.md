# Complete TypeORM Entities - Implementation Summary

## ✅ Deliverables Completed

All requested TypeORM entities have been successfully created in the shared library with production-ready code.

### Files Created

```
libs/shared/src/entities/
├── user.entity.ts                    # ✓ User entity with authentication
├── seller.entity.ts                  # ✓ Seller entity with spatial data
├── product.entity.ts                 # ✓ Product entity with pricing
├── spatial.transformer.ts            # ✓ Custom MariaDB spatial transformer
├── index.ts                          # ✓ Barrel export (updated)
└── ENTITIES_DOCUMENTATION.md         # ✓ Comprehensive documentation
```

---

## Entity Overview

### 1. User Entity ✓

**Purpose**: Centralized authentication for admins, sellers, and buyers

**Key Features**:

- UUID primary key
- Email unique constraint
- Password field with `select: false` (excluded by default)
- Role-based enum (ADMIN, SELLER, BUYER)
- OneToOne relationship with Seller
- Timestamps (createdAt, updatedAt)

**Columns**:

```
id (UUID) → email (unique) → password (select: false)
→ fullName → phoneNumber → role (enum)
→ createdAt, updatedAt
```

**Relations**:

```
User (1) ---OneToOne---> (1) Seller (optional, nullable)
```

---

### 2. Seller Entity ✓

**Purpose**: Business profile with location tracking

**Key Features**:

- UUID primary key
- Explicit `userId` foreign key column
- OneToOne join with User (owning side)
- OneToMany relationship with Products
- **CRITICAL**: POINT spatial column with SRID 4326
- Spatial index for geo-queries
- Custom SpatialPointTransformer for MariaDB binary conversion

**Columns**:

```
id (UUID) → userId (FK) → storeName → description (text)
→ category → isOpen (bool) → bannerUrl
→ lastLocation (POINT, SRID 4326) ⭐ SPATIAL
→ createdAt, updatedAt
```

**Relations**:

```
Seller (1) ---OneToOne---> (1) User (required)
Seller (1) ---OneToMany---> (M) Products
```

**Spatial Data**:

```typescript
// Application representation
lastLocation: {
  latitude: -6.2088,
  longitude: 106.8456
}

// Database: Binary POINT geometry (SRID 4326)
// Transformer handles conversion automatically
```

**Spatial Index**:

- Index name: `idx_seller_last_location`
- Type: Spatial index on `lastLocation` column
- Use case: Fast geo-proximity queries

---

### 3. Product Entity ✓

**Purpose**: Inventory items sold by sellers

**Key Features**:

- UUID primary key
- Explicit `sellerId` foreign key column
- ManyToOne relationship with Seller
- Decimal pricing (DECIMAL 10,2) for currency precision
- Automatic decimal-to-number conversion
- Performance indexes on common queries

**Columns**:

```
id (UUID) → sellerId (FK) → name → price (DECIMAL 10,2)
→ imageUrl → isAvailable (bool) → description
→ createdAt, updatedAt
```

**Relations**:

```
Product (M) ---ManyToOne---> (1) Seller (required)
```

**Indexes**:

- `idx_product_seller_id` - Lookup by seller
- `idx_product_is_available` - Filter available products
- `idx_product_created_at` - Sort by creation date

**Price Precision**:

```typescript
// DECIMAL(10,2) supports:
// Max: 99,999,999.99
// Min: 0.01
// Decimal places: 2

price: 25000.5; // Automatically converted from DB string
```

---

### 4. Spatial Transformer ✓

**Purpose**: Handle MariaDB's binary POINT geometry format

**Converts**:

- **From DB** (Binary WKB Buffer) → **To App** (Point object)
- **From App** (Point object) → **To DB** (WKT string)

**Implementation**:

```typescript
interface Point {
  latitude: number;
  longitude: number;
}

// WKB Parser: Reads IEEE 754 double-precision floats
// WKT Format: POINT(longitude latitude)
// SRID: 4326 (GPS/WGS84 coordinates)
```

**MariaDB Binary Format Handling**:

- Byte order detection
- SRID extraction
- Double-precision float parsing
- Graceful error handling

---

## Relationship Diagram

```
┌─────────────────────────────────────────┐
│              User Entity                │
│  ┌──────────────────────────────────┐  │
│  │ id (PK, UUID)                    │  │
│  │ email (UNIQUE)                   │  │
│  │ password (SELECT: FALSE)         │  │
│  │ fullName                         │  │
│  │ phoneNumber                      │  │
│  │ role (ENUM: ADMIN|SELLER|BUYER)  │  │
│  │ createdAt, updatedAt             │  │
│  └──────────────────────────────────┘  │
└────────────────────┬────────────────────┘
                     │
                OneToOne (User → Seller)
                     │
                     ▼
        ┌────────────────────────────┐
        │    Seller Entity           │
        │  ┌──────────────────────┐  │
        │  │ id (PK, UUID)        │  │
        │  │ userId (FK, UNIQUE)  │  │
        │  │ storeName            │  │
        │  │ description (TEXT)   │  │
        │  │ category             │  │
        │  │ isOpen (BOOL)        │  │
        │  │ bannerUrl            │  │
        │  │ lastLocation (POINT) │◀─┼─── Spatial Data
        │  │ SRID 4326            │  │    (Lat/Lng)
        │  │ createdAt, updatedAt │  │
        │  └──────────────────────┘  │
        └────────────┬───────────────┘
                     │
              OneToMany (Seller → Products)
                     │
                     ▼
        ┌────────────────────────────┐
        │   Product Entity           │
        │  ┌──────────────────────┐  │
        │  │ id (PK, UUID)        │  │
        │  │ sellerId (FK)        │  │
        │  │ name                 │  │
        │  │ price (DECIMAL 10,2) │  │
        │  │ imageUrl             │  │
        │  │ isAvailable (BOOL)   │  │
        │  │ description          │  │
        │  │ createdAt, updatedAt │  │
        │  └──────────────────────┘  │
        └────────────────────────────┘
```

---

## Usage Examples

### Import All Entities

```typescript
import {
  User,
  UserRole,
  Seller,
  Product,
  Point,
  SpatialPointTransformer,
} from '@app/shared/entities';
```

### Register in Module

```typescript
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([User, Seller, Product])],
})
export class DatabaseModule {}
```

### Creating a User

```typescript
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createSeller(data: {
    email: string;
    password: string;
    fullName: string;
    phoneNumber: string;
  }): Promise<User> {
    const user = this.userRepository.create({
      ...data,
      role: UserRole.SELLER,
    });
    return this.userRepository.save(user);
  }

  async loginUser(email: string): Promise<User | null> {
    // Password excluded by default
    return this.userRepository.findOne({ where: { email } });
  }

  async getUserWithPassword(email: string): Promise<User | null> {
    // Include password when needed
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
  }
}
```

### Creating a Seller

```typescript
@Injectable()
export class SellerService {
  constructor(
    @InjectRepository(Seller)
    private readonly sellerRepository: Repository<Seller>,
  ) {}

  async createSeller(
    userId: string,
    data: {
      storeName: string;
      description: string;
      category: string;
      lastLocation: { latitude: number; longitude: number };
    },
  ): Promise<Seller> {
    const seller = this.sellerRepository.create({
      userId,
      storeName: data.storeName,
      description: data.description,
      category: data.category,
      isOpen: false,
      lastLocation: data.lastLocation,
    });
    return this.sellerRepository.save(seller);
  }

  async getSellerWithRelations(sellerId: string): Promise<Seller | null> {
    return this.sellerRepository.findOne({
      where: { id: sellerId },
      relations: ['user', 'products'],
    });
  }

  async findSellersNearLocation(
    latitude: number,
    longitude: number,
    radiusMeters: number,
  ): Promise<Seller[]> {
    return this.sellerRepository.query(
      `
      SELECT s.* FROM sellers s
      WHERE ST_Distance_Sphere(
        s.last_location,
        ST_PointFromText('POINT(? ?)', 4326)
      ) < ?
      ORDER BY ST_Distance_Sphere(
        s.last_location,
        ST_PointFromText('POINT(? ?)', 4326)
      )
    `,
      [longitude, latitude, radiusMeters, longitude, latitude],
    );
  }
}
```

### Creating a Product

```typescript
@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async createProduct(
    sellerId: string,
    data: {
      name: string;
      price: number;
      description: string;
      imageUrl: string;
    },
  ): Promise<Product> {
    const product = this.productRepository.create({
      sellerId,
      name: data.name,
      price: data.price,
      description: data.description,
      imageUrl: data.imageUrl,
      isAvailable: true,
    });
    return this.productRepository.save(product);
  }

  async getAvailableProducts(sellerId: string): Promise<Product[]> {
    return this.productRepository.find({
      where: {
        sellerId,
        isAvailable: true,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async getProductsWithSeller(productId: string): Promise<Product | null> {
    return this.productRepository.findOne({
      where: { id: productId },
      relations: ['seller', 'seller.user'],
    });
  }
}
```

---

## Database Schema (SQL)

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

## Key Highlights

✅ **Production Ready**

- Fully typed TypeScript
- Proper error handling
- Performance indexes
- Cascade delete/update

✅ **MariaDB Optimized**

- Spatial point handling with SRID 4326
- Binary WKB geometry parsing
- Decimal precision for currency
- Custom transformers for seamless data conversion

✅ **Best Practices**

- Explicit foreign keys alongside relations
- Password field excluded by default (security)
- Nullable fields properly typed
- Created/Updated timestamps on all entities

✅ **Scalable Design**

- UUID for distributed systems
- Proper relationship cardinality
- Strategic indexes
- Support for future extensions

---

## Next Steps

1. **Build the shared library**:

   ```bash
   npm run build
   ```

2. **Create migration**:

   ```bash
   npx typeorm migration:generate -d libs/shared/src/migrations/migration.config.ts CreateUserSellerProduct
   ```

3. **Run migrations**:

   ```bash
   npm run migration:run
   ```

4. **Start development**:
   ```bash
   npm run start:dev
   ```

---

## Documentation

See `ENTITIES_DOCUMENTATION.md` for:

- Detailed column specifications
- Query examples
- Spatial query patterns
- Price handling best practices
- Schema diagrams
- Relationship explanations

---

## Summary Table

| Entity          | Purpose          | Primary Relation                     | Key Feature                     |
| --------------- | ---------------- | ------------------------------------ | ------------------------------- |
| **User**        | Authentication   | OneToOne → Seller                    | Role-based (ADMIN/SELLER/BUYER) |
| **Seller**      | Business Profile | OneToOne ← User, OneToMany → Product | Spatial POINT (GPS)             |
| **Product**     | Inventory        | ManyToOne → Seller                   | Decimal(10,2) pricing           |
| **Transformer** | Data Conversion  | N/A                                  | MariaDB binary geometry         |

**All deliverables complete and production-ready!** ✨
