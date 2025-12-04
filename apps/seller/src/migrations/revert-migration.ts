#!/usr/bin/env node

import { DataSource } from 'typeorm';
import { migrationConfig } from './migration.config';
import { MigrationExecutor } from 'typeorm';

async function revertLastMigrationFromEnv() {
  console.log('🔄 Starting Migration Revert Process');
  console.log('====================================');

  try {
    // Create DataSource with environment configuration
    const dataSource = new DataSource(migrationConfig);

    // Initialize the connection
    await dataSource.initialize();
    console.log('✅ Database connection established');

    // Create migration executor
    const migrationExecutor = new MigrationExecutor(dataSource);

    // Get executed migrations
    const executedMigrations = await migrationExecutor.getExecutedMigrations();

    console.log(`📊 Current Migration Status:`);
    console.log(`   Executed migrations: ${executedMigrations.length}`);

    if (executedMigrations.length > 0) {
      const lastMigration = executedMigrations[executedMigrations.length - 1];
      console.log(`   Last migration: ${lastMigration}`);

      console.log('\n🔄 Reverting last migration...');

      // Revert the last migration
      await migrationExecutor.undoLastMigration();

      console.log('✅ Last migration reverted successfully!');
      console.log(`   Reverted: ${lastMigration}`);

      // Show updated status
      const updatedExecutedMigrations =
        await migrationExecutor.getExecutedMigrations();
      console.log(`\n📊 Updated Migration Status:`);
      console.log(
        `   Executed migrations: ${updatedExecutedMigrations.length}`,
      );
    } else {
      console.log('ℹ️  No migrations to revert');
    }

    // Close the connection
    await dataSource.destroy();
    console.log('\n🔌 Database connection closed');
    console.log('🎉 Migration revert process completed!');
  } catch (error) {
    console.error('❌ Migration revert failed:');
    console.error('   Error:', error.message);

    if (error.message.includes('No migrations are pending')) {
      console.log('\nℹ️  No migrations to revert');
    } else {
      console.log('\n🔧 Troubleshooting:');
      console.log('   1. Ensure database connection is working');
      console.log('   2. Check if migrations table exists');
      console.log('   3. Verify migration files are correct');
    }

    process.exit(1);
  }
}

// Run migration revert if this file is executed directly
if (require.main === module) {
  const command = process.argv[2];

  if (command === 'revert' || command === undefined) {
    revertLastMigrationFromEnv();
  } else if (command === 'help') {
    console.log('Usage:');
    console.log('  npm run migration:revert           - Revert last migration');
    console.log(
      '  npm run migration:revert help      - Show this help message',
    );
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

export { revertLastMigrationFromEnv };
