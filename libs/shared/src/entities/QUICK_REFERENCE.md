# Entity Quick Reference

## Files Created

### Core Entities

- **user.entity.ts** - Authentication entity with role-based access
- **seller.entity.ts** - Business profile with spatial GPS data
- **product.entity.ts** - Product inventory with decimal pricing

### Utilities

- **spatial.transformer.ts** - Custom TypeORM transformer for MariaDB POINT geometry
- **index.ts** - Barrel export for all entities and utilities

### Documentation

- **ENTITIES_DOCUMENTATION.md** - Comprehensive entity guide
- **ENTITIES_IMPLEMENTATION_SUMMARY.md** - Implementation overview

---

## Entity Properties Quick Lookup

### User Entity

```typescript
id: UUID (PK)
email: string (UNIQUE)
password: string (SELECT: FALSE)
fullName: string
phoneNumber: string | null
role: enum (ADMIN | SELLER | BUYER) = BUYER
createdAt: timestamp
updatedAt: timestamp

Relations:
  seller: Seller | null (OneToOne, inverse)
```

### Seller Entity

```typescript
id: UUID (PK)
userId: string (FK, UNIQUE)
storeName: string
description: string | null
category: string | null
isOpen: boolean = false
bannerUrl: string | null
lastLocation: Point | null  // { latitude, longitude }
createdAt: timestamp
updatedAt: timestamp

Relations:
  user: User (OneToOne, owning)
  products: Product[] (OneToMany)

Indexes:
  idx_seller_last_location (SPATIAL)
```

### Product Entity

```typescript
id: UUID (PK)
sellerId: string (FK)
name: string
price: number (DECIMAL 10,2)
imageUrl: string | null
isAvailable: boolean = true
description: string | null
createdAt: timestamp
updatedAt: timestamp

Relations:
  seller: Seller (ManyToOne)

Indexes:
  idx_product_seller_id
  idx_product_is_available
  idx_product_created_at
```

---

## Common Imports

```typescript
// Import all at once
import {
  User,
  UserRole,
  Seller,
  Product,
  Point,
  SpatialPointTransformer,
} from '@app/shared/entities';

// Use in module
TypeOrmModule.forFeature([User, Seller, Product]);
```

---

## Relationship Summary

```
User (1) ──OneToOne──> (1) Seller ──OneToMany──> (M) Product
         (inverse)          (owning)
```

---

## Key Features

- ✅ UUID primary keys (distributed systems ready)
- ✅ Role-based user access (ADMIN, SELLER, BUYER)
- ✅ MariaDB POINT geometry with SRID 4326 (GPS)
- ✅ Spatial index for geo-queries
- ✅ Custom SpatialPointTransformer for binary conversion
- ✅ Decimal pricing (DECIMAL 10,2) for currency
- ✅ Password excluded from default queries (security)
- ✅ Cascade delete/update on relationships
- ✅ Performance indexes
- ✅ Explicit FK columns for easier access

---

## Spatial Data Example

```typescript
// Create seller with location
const seller = await sellerRepository.create({
  userId: user.id,
  storeName: 'Fresh Mart',
  lastLocation: {
    latitude: -6.2088,
    longitude: 106.8456, // Jakarta
  },
});

// Query nearby sellers
const nearby = await sellerRepository.query(`
  SELECT * FROM sellers
  WHERE ST_Distance_Sphere(
    last_location,
    ST_PointFromText('POINT(106.8456 -6.2088)', 4326)
  ) < 5000  -- 5 km radius
  ORDER BY distance
`);
```

---

## Password Handling Example

```typescript
// By default, password is excluded
const user = await userRepository.findOne({ where: { email } });
console.log(user.password); // undefined

// Include password when needed
const userWithPassword = await userRepository
  .createQueryBuilder('user')
  .addSelect('user.password')
  .where('user.email = :email', { email })
  .getOne();
console.log(userWithPassword.password); // hashed password
```

---

## Next Steps

1. Generate migrations:

   ```bash
   npx typeorm migration:generate -d libs/shared/src/migrations/migration.config.ts CreateUserSellerProduct
   ```

2. Run migrations:

   ```bash
   npm run migration:run
   ```

3. Use in your services:

   ```typescript
   import { User, Seller, Product } from '@app/shared/entities';

   @Injectable()
   export class MyService {
     constructor(
       @InjectRepository(User) private userRepo: Repository<User>,
       @InjectRepository(Seller) private sellerRepo: Repository<Seller>,
       @InjectRepository(Product) private productRepo: Repository<Product>,
     ) {}
   }
   ```

---

## Support

See `ENTITIES_DOCUMENTATION.md` for:

- Detailed column specifications
- Complete usage examples
- Query patterns
- Best practices
- SQL schema
- Relationship diagrams
