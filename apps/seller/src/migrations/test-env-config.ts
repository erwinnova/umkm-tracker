#!/usr/bin/env node

import { config } from 'dotenv';
import { DataSource } from 'typeorm';

// Load environment variables from .env file
config();

async function testEnvConfiguration() {
  console.log('🧪 Testing Environment Configuration');
  console.log('=====================================');

  try {
    // Display loaded environment variables
    console.log('📋 Environment Variables:');
    console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'Not set'}`);
    console.log(`   DB_HOST: ${process.env.DB_HOST || 'Not set'}`);
    console.log(`   DB_PORT: ${process.env.DB_PORT || 'Not set'}`);
    console.log(`   DB_USERNAME: ${process.env.DB_USERNAME || 'Not set'}`);
    console.log(
      `   DB_PASSWORD: ${process.env.DB_PASSWORD ? '***CONFIGURED***' : 'Not set'}`,
    );
    console.log(`   DB_NAME: ${process.env.DB_NAME || 'Not set'}`);
    console.log(
      `   JWT_SECRET: ${process.env.JWT_SECRET ? '***CONFIGURED***' : 'Not set'}`,
    );

    // Test database connection
    console.log('\n🔌 Testing Database Connection...');

    const dataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'umkm_tracker_seller',
      logging: false,
    });

    await dataSource.initialize();
    console.log('✅ Database connection successful!');

    // Test basic query
    const result = await dataSource.query('SELECT version()');
    console.log(`📊 Database Version: ${result[0].version}`);

    // Check if migrations table exists
    const migrationsTableExists = await dataSource.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'migrations'
      )
    `);

    console.log(
      `🗄️ Migrations Table Exists: ${migrationsTableExists[0].exists}`,
    );

    if (migrationsTableExists[0].exists) {
      const migrationCount = await dataSource.query(
        'SELECT COUNT(*) as count FROM migrations',
      );
      console.log(`📋 Executed Migrations: ${migrationCount[0].count}`);
    }

    // Check if users table exists
    const usersTableExists = await dataSource.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      )
    `);

    console.log(`👥 Users Table Exists: ${usersTableExists[0].exists}`);

    if (usersTableExists[0].exists) {
      const userCount = await dataSource.query(
        'SELECT COUNT(*) as count FROM users',
      );
      console.log(`📊 Users Count: ${userCount[0].count}`);
    }

    // Test UUID extension
    const uuidExtension = await dataSource.query(`
      SELECT EXISTS (
        SELECT FROM pg_extension 
        WHERE extname = 'uuid-ossp'
      )
    `);

    console.log(
      `🔑 UUID Extension: ${uuidExtension[0].exists ? 'Enabled' : 'Not found'}`,
    );

    await dataSource.destroy();

    console.log('\n🎉 Configuration Test Complete!');
    console.log('✅ Environment variables loaded successfully');
    console.log('✅ Database connection works');
    console.log('✅ Ready to run migrations');

    console.log('\n🚀 Next Steps:');
    console.log('   npm run migration:run     - Run pending migrations');
    console.log('   npm run migration:status - Check migration status');
    console.log('   npm run start:dev        - Start the application');
  } catch (error) {
    console.error('❌ Configuration Test Failed:');
    console.error('   Error:', error.message);

    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n🔧 Troubleshooting:');
      console.log('   1. Ensure PostgreSQL is running');
      console.log('   2. Check .env file for correct database settings');
      console.log(
        '   3. Verify database exists: CREATE DATABASE umkm_tracker_seller;',
      );
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

    if (error.message.includes('password authentication failed')) {
      console.log('\n🔧 Authentication Issue:');
      console.log('   1. Check DB_USERNAME and DB_PASSWORD in .env');
      console.log('   2. Verify PostgreSQL user exists');
      console.log('   3. Check user permissions');
    }

    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  testEnvConfiguration();
}

export { testEnvConfiguration };
