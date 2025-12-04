#!/usr/bin/env node

import { DataSource } from 'typeorm';
import { config } from 'dotenv';

// Load environment variables
config();

async function setupDatabase() {
  console.log('🚀 Setting up Database for UMKM Tracker API');
  console.log('==========================================');
  
  try {
    // Connect to PostgreSQL (default database)
    const defaultConnection = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: 'postgres', // Connect to default database first
      logging: false,
    });
    
    await defaultConnection.initialize();
    console.log('✅ Connected to PostgreSQL');
    
    // Create the database if it doesn't exist
    const dbName = process.env.DB_NAME || 'umkm_tracker_seller';
    
    try {
      await defaultConnection.query(`CREATE DATABASE \"${dbName}\"`);
      console.log(`✅ Database '${dbName}' created successfully`);
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log(`✅ Database '${dbName}' already exists`);
      } else {
        throw error;
      }
    }
    
    // Close the default connection
    await defaultConnection.destroy();
    
    // Connect to the target database
    const targetConnection = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: dbName,
      logging: false,
    });
    
    await targetConnection.initialize();
    console.log(`✅ Connected to database '${dbName}'`);
    
    // Enable UUID extension
    try {
      await targetConnection.query('CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\"');
      console.log('✅ UUID extension enabled');
    } catch (error) {
      console.log('⚠️  Warning: Could not enable UUID extension:', error.message);
    }
    
    // Check if migrations table exists
    const migrationsTableExists = await targetConnection.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'migrations'
      )
    `);
    
    console.log(`🗄️ Migrations Table: ${migrationsTableExists[0].exists ? 'Exists' : 'Not found'}`);
    
    // Test UUID generation
    try {
      const uuidTest = await targetConnection.query('SELECT uuid_generate_v4() as test_uuid');
      console.log(`🔑 UUID Generation: Working (${uuidTest[0].test_uuid})`);
    } catch (error) {
      console.log('❌ UUID Generation: Failed -', error.message);
      console.log('   You may need to enable the uuid-ossp extension manually');
    }
    
    await targetConnection.destroy();
    
    console.log('\n🎉 Database setup complete!');
    console.log('\n🚀 Next Steps:');
    console.log('   npm run migration:run     - Run pending migrations');
    console.log('   npm run migration:status - Check migration status');
    console.log('   npm run start:dev        - Start the application');
    
  } catch (error) {
    console.error('❌ Database setup failed:');
    console.error('   Error:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n🔧 Troubleshooting:');
      console.log('   1. Ensure PostgreSQL is running');
      console.log('   2. Check your PostgreSQL service');
      console.log('   3. Verify host and port in .env');
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
  setupDatabase();
}

export { setupDatabase };