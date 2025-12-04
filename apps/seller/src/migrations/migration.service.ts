import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource, MigrationExecutor } from 'typeorm';

@Injectable()
export class MigrationService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  async runMigrations(): Promise<void> {
    try {
      const migrationExecutor = new MigrationExecutor(this.dataSource);
      const migrations = await migrationExecutor.getAllMigrations();
      const pendingMigrations = await migrationExecutor.getPendingMigrations();

      console.log(`Total migrations: ${migrations.length}`);
      console.log(`Pending migrations: ${pendingMigrations.length}`);

      if (pendingMigrations.length > 0) {
        console.log('Running pending migrations...');
        await migrationExecutor.executePendingMigrations();
        console.log('Migrations completed successfully!');
      } else {
        console.log('No pending migrations to run.');
      }
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }

  async revertLastMigration(): Promise<void> {
    try {
      const migrationExecutor = new MigrationExecutor(this.dataSource);
      await migrationExecutor.undoLastMigration();
      console.log('Last migration reverted successfully!');
    } catch (error) {
      console.error('Migration revert failed:', error);
      throw error;
    }
  }

  async showMigrations(): Promise<any> {
    const migrationExecutor = new MigrationExecutor(this.dataSource);
    const executedMigrations = await migrationExecutor.getExecutedMigrations();
    const pendingMigrations = await migrationExecutor.getPendingMigrations();

    return {
      executed: executedMigrations,
      pending: pendingMigrations,
    };
  }

  async createDataSourceFromEnv(): Promise<DataSource> {
    const config = {
      type: 'postgres' as const,
      host: this.configService.get<string>('DB_HOST', 'localhost'),
      port: this.configService.get<number>('DB_PORT', 5432),
      username: this.configService.get<string>('DB_USERNAME', 'postgres'),
      password: this.configService.get<string>('DB_PASSWORD', 'postgres'),
      database: this.configService.get<string>(
        'DB_NAME',
        'umkm_tracker_seller',
      ),
      migrations: ['apps/seller/src/migrations/*.ts'],
      logging: this.configService.get<string>('NODE_ENV') === 'development',
    };

    return new DataSource(config);
  }
}
