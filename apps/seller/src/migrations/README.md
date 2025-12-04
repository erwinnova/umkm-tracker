"# Database Migration Guide

## Overview

This migration system provides TypeORM-based database schema management for the UMKM Tracker API.

## Available Migrations

### 001_CreateUsersTable.ts
- Creates the `users` table
- Adds UUID primary key
- Includes email, password, name fields
- Adds created_at and updated_at timestamps
- Creates unique index on email

## Migration Methods

### 1. HTTP API Endpoints

#### Run Migrations
```bash
POST /migrations/run
```

#### Revert Last Migration
```bash
POST /migrations/revert
```

#### Get Migration Status
```bash
GET /migrations/status
```

### 2. CLI Commands

#### Run Pending Migrations
```bash
npm run migration:run
```

#### Revert Last Migration
```bash
npm run migration:revert
```

#### Show Migration Status
```bash
npm run migration:show
```

#### Generate New Migration
```bash
npm run migration:generate -- -n MigrationName
```

### 3. Programmatically

```typescript
import { MigrationService } from './src/migrations/migration.service';

// Run migrations
await migrationService.runMigrations();

// Revert last migration
await migrationService.revertLastMigration();

// Get status
const status = await migrationService.showMigrations();
```

## Environment Configuration

Make sure your `.env` file has the correct database settings:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=umkm_tracker_seller
NODE_ENV=development
```

## Database Setup

### PostgreSQL Setup

1. Install PostgreSQL
2. Create database:
```sql
CREATE DATABASE umkm_tracker_seller;
```

3. Enable UUID extension:
```sql
CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";
```

## Migration Files Structure

```
apps/seller/src/migrations/
├── 001_CreateUsersTable.ts
├── migration.service.ts
├── migration.controller.ts
├── migration.module.ts
├── migration-cli.ts
└── README.md
```

## Creating New Migrations

### 1. Manually Create Migration File

```typescript
import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateNewTable1640000000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create your table here
    await queryRunner.createTable(
      new Table({
        name: 'your_table',
        columns: [
          // Define columns
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop table
    await queryRunner.dropTable('your_table');
  }
}
```

### 2. Using TypeORM CLI

```bash
# Generate migration from entity changes
npm run migration:generate -- -n CreateTable

# Create empty migration
typeorm migration:create -n CreateTable
```

## Security Notes

- Migration endpoints should be secured in production
- Consider adding authentication to migration endpoints
- Use environment variables for sensitive configuration
- Always backup database before running migrations in production

## Best Practices

1. **Always test migrations** on staging before production
2. **Create reversible migrations** with proper `down()` methods
3. **Use descriptive names** for migration files
4. **Version control migrations** with your code
5. **Document schema changes** in migration comments
6. **Use transactions** for complex multi-table changes

## Troubleshooting

### Common Issues

#### Migration Already Executed
- Check `migrations` table for executed migrations
- Use `npm run migration:show` to see status

#### Database Connection Issues
- Verify PostgreSQL is running
- Check connection string in `.env`
- Ensure database exists

#### UUID Generation Issues
- Ensure `uuid-ossp` extension is enabled
- Check PostgreSQL version compatibility

### Debug Mode

Enable logging in app.module.ts:

```typescript
logging: true,
```

## Production Deployment

### Migration Checklist

1. [ ] Backup database
2. [ ] Test migrations on staging
3. [ ] Disable synchronize in production
4. [ ] Secure migration endpoints
5. [ ] Monitor migration logs
6. [ ] Verify table creation

### Production Scripts

```bash
# Production migration run
NODE_ENV=production npm run migration:run

# Check migration status
npm run migration:show
```

## Table Schema

### Users Table

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() |
| email | VARCHAR(255) | UNIQUE, NOT NULL |
| password | VARCHAR(255) | NOT NULL |
| name | VARCHAR(255) | NOT NULL |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

### Indexes

- `IDX_USERS_EMAIL` - Unique index on email column

## Next Steps

1. Add more entity migrations as needed
2. Create seed data migrations
3. Add data transformation migrations
4. Implement backup strategies
5. Add monitoring and alerting
"