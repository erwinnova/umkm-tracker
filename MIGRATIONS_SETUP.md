# Migration Setup - Summary

## Completed ✅

### 1. Migration Configuration

- **migration.config.ts** - Centralized TypeORM configuration for all three databases
- Supports seller, buyer, and admin database connections
- Configurable through environment variables

### 2. Migration Files

- **1701702000000-CreateUsersTable.ts** - Initial migration for User entity
- Creates users table with proper columns and indexes
- Includes both up() and down() methods

### 3. Migration Utilities

- **migration.utils.ts** - Helper functions:
  - `runMigrations()` - Execute pending migrations
  - `revertMigration()` - Undo last migration
  - `showMigrationStatus()` - Display migration history
  - `generateMigrationName()` - Generate timestamped names

### 4. Migration Runner

- **migration-runner.ts** - CLI tool for running migrations
- Supports commands: run, revert, status
- Can target specific apps or all at once

### 5. NPM Scripts Added

```
npm run migration:run              # Run all databases
npm run migration:run:seller       # Seller database
npm run migration:run:buyer        # Buyer database
npm run migration:run:admin        # Admin database
npm run migration:revert           # Revert all databases
npm run migration:revert:seller    # Revert seller
npm run migration:revert:buyer     # Revert buyer
npm run migration:revert:admin     # Revert admin
npm run migration:status           # Show status all databases
npm run migration:status:seller    # Show status seller
npm run migration:status:buyer     # Show status buyer
npm run migration:status:admin     # Show status admin
```

### 6. Documentation

- **README.md** - Comprehensive migration guide

## Project Structure

```
libs/shared/src/
├── entities/                    # Shared entities
│   ├── user.entity.ts
│   └── index.ts
├── migrations/                  # NEW: Migration system
│   ├── migration.config.ts
│   ├── migration.utils.ts
│   ├── migration-runner.ts
│   ├── 1701702000000-CreateUsersTable.ts
│   ├── index.ts
│   └── README.md
├── filters/
├── interceptors/
└── index.ts                     # Updated: exports migrations
```

## Usage

### First Time Setup

```bash
# 1. Ensure .env is configured with DB credentials
# 2. Run migrations to create tables
npm run migration:run

# 3. Start the application
npm run start:dev
```

### Add New Entity

```bash
# 1. Create entity in libs/shared/src/entities/
# 2. Generate migration (if using TypeORM CLI)
npx typeorm migration:generate -d libs/shared/src/migrations/migration.config.ts
# 3. Run migrations
npm run migration:run:seller
```

### Revert Changes

```bash
npm run migration:revert:seller
```

## Key Features

✅ **Centralized** - All migrations in one place (shared library)  
✅ **Scalable** - Easy to add new entities and migrations  
✅ **Flexible** - Run migrations per app or all at once  
✅ **Traceable** - Migration history tracked in database  
✅ **Reversible** - Up/down methods for every migration  
✅ **Well-documented** - Comprehensive README included

## Required Environment Variables

```env
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_NAME=umkm_tracker_seller
DB_NAME_BUYER=umkm_tracker_buyer
DB_NAME_ADMIN=umkm_tracker_admin
NODE_ENV=development
```

## Next Steps

1. Build the shared library:

   ```bash
   npm run build
   ```

2. Configure `.env` file with database credentials

3. Run migrations:

   ```bash
   npm run migration:run
   ```

4. Start development:
   ```bash
   npm run start:dev
   ```

## Notes

- All migrations share the same Users table schema
- Each app has its own database but same schema
- Migrations are automatically run on app startup if `migrationsRun: true`
- Use TypeORM CLI for generating migrations from entity changes
