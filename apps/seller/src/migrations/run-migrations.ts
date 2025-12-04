#!/usr/bin/env node

import { DataSource } from 'typeorm';
import { migrationConfig } from './migration.config';
import { MigrationExecutor } from 'typeorm';

async function runMigrationsFromEnv() {
  console.log('🚀 Starting Migration Process');
  console.log('=================================');

  try {
    // Create DataSource with environment configuration
    const dataSource = new DataSource(migrationConfig);

    // Initialize the connection
    await dataSource.initialize();
    console.log('✅ Database connection established');

    // Create migration executor
    const migrationExecutor = new MigrationExecutor(dataSource);

    // Get migration status
    const allMigrations = await migrationExecutor.getAllMigrations();
    const pendingMigrations = await migrationExecutor.getPendingMigrations();

    console.log(`📊 Migration Status:`);
    console.log(`   Total migrations: ${allMigrations.length}`);
    console.log(`   Pending migrations: ${pendingMigrations.length}`);
    console.log(
      `   Executed migrations: ${allMigrations.length - pendingMigrations.length}`,
    );

    if (pendingMigrations.length > 0) {
      console.log('\n🔄 Running pending migrations...');

      // Execute pending migrations
      await migrationExecutor.executePendingMigrations();

      console.log('✅ All migrations completed successfully!');
      console.log('\n📋 Executed migrations:');
      pendingMigrations.forEach((migration, index) => {
        console.log(`   ${index + 1}. ${migration}`);
      });
    } else {
      console.log('✅ No pending migrations to run');
    }

    // Close the connection
    await dataSource.destroy();
    console.log('\n🔌 Database connection closed');
    console.log('🎉 Migration process completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:');
    console.error('   Error:', error.message);

    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n🔧 Troubleshooting:');
      console.log('   1. Ensure PostgreSQL is running');
      console.log('   2. Check .env file for correct database settings');
      console.log(
        '   3. Verify database exists: CREATE DATABASE umkm_tracker_seller;',
      );
      console.log('   4. Check database credentials and permissions');
    }

    if (
      error.message.includes(
        'database \\\"umkm_tracker_seller\\\" does not exist',
      )
    ) {
      console.log('\n🔧 Database Setup Required:');
      console.log('   1. Connect to PostgreSQL: psql -U postgres');
      console.log(
        '   2. Create database: CREATE DATABASE umkm_tracker_seller;',
      );
      console.log(
        '   3. Enable UUID extension: CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";',
      );
      console.log('   4. Exit: \\q');
    }

    process.exit(1);
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  const command = process.argv[2];

  if (command === 'run' || command === undefined) {
    runMigrationsFromEnv();
  } else if (command === 'help') {
    console.log('Usage:');
    console.log(
      '  npm run migration:run           - Run all pending migrations',
    );
    console.log('  npm run migration:run help      - Show this help message');
    console.log('\nEnvironment variables loaded from .env file:');
    console.log(`  DB_HOST: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`  DB_PORT: ${process.env.DB_PORT || '5432'}`);
    console.log(`  DB_USERNAME: ${process.env.DB_USERNAME || 'postgres'}`);
    console.log(`  DB_NAME: ${process.env.DB_NAME || 'umkm_tracker_seller'}`);
  } else {
    console.log('Unknown command:', command);
    console.log('Use \\\"help\\\" for available commands');
  }
}

export { runMigrationsFromEnv };
