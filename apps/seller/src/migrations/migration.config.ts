import { config } from 'dotenv';
import { DataSourceOptions } from 'typeorm';

// Load environment variables from .env file
config();

export const migrationConfig: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'umkm_tracker',
  migrations: ['apps/seller/src/migrations/*.ts'],
  entities: [],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
};

// Log configuration (without sensitive data)
console.log('Migration Configuration:');
console.log(`  Type: PostgreSQL`);
console.log(`  Host: ${migrationConfig.host}`);
console.log(`  Port: ${migrationConfig.port}`);
console.log(`  Username: ${migrationConfig.username}`);
console.log(`  Database: ${migrationConfig.database}`);
console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`  Logging: ${migrationConfig.logging}`);

export default migrationConfig;
