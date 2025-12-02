# Database Setup Instructions

## Step 1: Add Database Configuration to .env

Add these lines to your `.env` file:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password_here
DB_NAME=umkm_tracker
```

## Step 2: Install PostgreSQL

If you don't have PostgreSQL installed:

1. Download from: https://www.postgresql.org/download/windows/
2. Install with default settings
3. Remember the password you set for the `postgres` user

## Step 3: Create Database

Open PostgreSQL command line (psql) or pgAdmin and run:

```sql
CREATE DATABASE umkm_tracker;
```

Or use PowerShell:

```powershell
psql -U postgres -c "CREATE DATABASE umkm_tracker;"
```

## Step 4: Update .env File

Update your `.env` file with your actual PostgreSQL password:

```env
DB_PASSWORD=your_actual_postgres_password
```

## Step 5: Restart the Server

```bash
# Stop the current server (Ctrl+C in terminal)
# Then restart:
npm run start:dev
```

## Verification

The server should connect to PostgreSQL and automatically create the `users` table.

Check the console output for:
```
[TypeOrmModule] Database connection successful
```

## Troubleshooting

### Error: "ECONNREFUSED"
- PostgreSQL service is not running
- Start PostgreSQL service:
  ```powershell
  net start postgresql-x64-<version>
  ```

### Error: "password authentication failed"
- Check DB_PASSWORD in .env matches your PostgreSQL password

### Error: "database does not exist"
- Create the database using Step 3

## Database Structure

After setup, you'll have:

**users table:**
- id (uuid, primary key)
- email (varchar, unique)
- password (varchar)
- name (varchar)
- createdAt (timestamp)
- updatedAt (timestamp)
