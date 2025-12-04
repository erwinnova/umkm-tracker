#!/usr/bin/env node

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { MigrationService } from './migration.service';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

async function runMigrationCLI() {
  try {
    // Create a standalone application with config
    const configService = new ConfigService();

    // Create DataSource from environment variables
    const dataSource = new DataSource({
      type: 'postgres',
      host: configService.get<string>('DB_HOST', 'localhost'),
      port: configService.get<number>('DB_PORT', 5432),
      username: configService.get<string>('DB_USERNAME', 'postgres'),
      password: configService.get<string>('DB_PASSWORD', 'postgres'),
      database: configService.get<string>('DB_NAME', 'umkm_tracker'),
      migrations: ['apps/seller/src/migrations/*.ts'],
      logging: configService.get<string>('NODE_ENV') === 'development',
    });

    // Initialize the DataSource
    await dataSource.initialize();
    console.log('Database connection established from .env file');

    // Create migration service
    const migrationService = new MigrationService(dataSource, configService);

    const command = process.argv[2];

    switch (command) {
      case 'run':
        console.log('Running migrations...');
        await migrationService.runMigrations();
        break;
      case 'revert':
        console.log('Reverting last migration...');
        await migrationService.revertLastMigration();
        break;
      case 'status':
        console.log('Checking migration status...');
        const status = await migrationService.showMigrations();
        console.log('Executed migrations:', status.executed);
        console.log('Pending migrations:', status.pending);
        break;
      default:
        console.log('Usage:');
        console.log(
          '  npm run migration:cli run      - Run all pending migrations',
        );
        console.log('  npm run migration:cli revert   - Revert last migration');
        console.log('  npm run migration:cli status   - Show migration status');
        console.log('\nEnvironment variables loaded from .env file:');
        console.log(`  DB_HOST: ${configService.get('DB_HOST', 'localhost')}`);
        console.log(`  DB_PORT: ${configService.get('DB_PORT', 5432)}`);
        console.log(
          `  DB_USERNAME: ${configService.get('DB_USERNAME', 'postgres')}`,
        );
        console.log(
          `  DB_NAME: ${configService.get('DB_NAME', 'umkm_tracker_seller')}`,
        );
        break;
    }

    // Close the connection
    await dataSource.destroy();
    console.log('Database connection closed');
  } catch (error) {
    console.error('CLI Error:', error.message);
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\nTroubleshooting:');
      console.log('1. Ensure PostgreSQL is running');
      console.log('2. Check .env file for correct database settings');
      console.log(
        '3. Verify database exists: CREATE DATABASE umkm_tracker_seller;',
      );
    }
    process.exit(1);
  }
}

runMigrationCLI();
