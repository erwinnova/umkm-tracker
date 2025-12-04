#!/usr/bin/env node

import { DataSource } from 'typeorm';
import { config } from 'dotenv';

// Load environment variables
config();

async function runSimpleMigration() {
  console.log('🚀 Running Simple Database Migration');
  console.log('=====================================');
  
  try {
    // Create DataSource
    const dataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'umkm_tracker',
      logging: false,
    });
    
    await dataSource.initialize();
    console.log('✅ Database connection established');
    
    // Enable UUID extension
    try {
      await dataSource.query('CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\"');
      console.log('✅ UUID extension enabled');
    } catch (error) {
      console.log('⚠️  Warning: Could not enable UUID extension:', error.message);
    }
    
    // Create migrations table
    await dataSource.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        name VARCHAR(255) NOT NULL,
        UNIQUE (name)
      );
    `);
    console.log('✅ Migrations table created/verified');
    
    // Create users table
    await dataSource.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);
    console.log('✅ Users table created');
    
    // Create email index
    await dataSource.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS IDX_USERS_EMAIL ON users(email);
    `);
    console.log('✅ Email index created');
    
    // Create trigger for updated_at
    await dataSource.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);
    
    await dataSource.query(`
      CREATE TRIGGER update_users_updated_at 
        BEFORE UPDATE ON users 
        FOR EACH ROW 
        EXECUTE FUNCTION update_updated_at_column();
    `);
    console.log('✅ Updated_at trigger created');
    
    // Record migration as executed
    await dataSource.query(`
      INSERT INTO migrations (name) 
      VALUES ('CreateUsersTable1640000000001') 
      ON CONFLICT (name) DO NOTHING;
    `);
    console.log('✅ Migration recorded');
    
    // Insert test users
    const bcrypt = require('bcrypt');
    const passwordHash = await bcrypt.hash('password123', 10);
    
    await dataSource.query(`
      INSERT INTO users (id, email, password, name, created_at, updated_at) 
      VALUES 
        ('550e8400-e29b-41d4-a716-446655440001', 'seller@umkm.com', $1, 'Test UMKM Seller', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('550e8400-e29b-41d4-a716-446655440002', 'shop@umkm.com', $2, 'UMKM Shop Owner', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('550e8400-e29b-41d4-a716-446655440003', 'admin@umkm.com', $3, 'UMKM Admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (email) DO NOTHING;
    `, [passwordHash, passwordHash, passwordHash]);
    console.log('✅ Test users inserted');
    
    // Verify tables
    const tables = await dataSource.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE';
    `);
    
    console.log('\n📊 Database Status:');
    console.log('   Tables created:', tables.map(t => t.table_name).join(', '));
    
    const userCount = await dataSource.query('SELECT COUNT(*) as count FROM users');
    console.log(`   Users in database: ${userCount[0].count}`);
    
    await dataSource.destroy();
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('\n🚀 Next Steps:');
    console.log('   npm run start:dev        - Start the application');
    console.log('   Test login with: seller@umkm.com / password123');
    
  } catch (error) {
    console.error('❌ Migration failed:');
    console.error('   Error:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n🔧 Troubleshooting:');
      console.log('   1. Ensure PostgreSQL is running');
      console.log('   2. Check .env file for correct database settings');
      console.log('   3. Verify database exists');
    }
    
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  runSimpleMigration();
}

export { runSimpleMigration };