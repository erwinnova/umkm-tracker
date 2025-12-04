import { Controller, Post, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { MigrationService } from './migration.service';

@Controller('migrations')
export class MigrationController {
  constructor(private readonly migrationService: MigrationService) {}

  @Post('run')
  @HttpCode(HttpStatus.OK)
  async runMigrations() {
    try {
      await this.migrationService.runMigrations();
      return {
        message: 'Migrations completed successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        message: 'Migration failed',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Post('revert')
  @HttpCode(HttpStatus.OK)
  async revertLastMigration() {
    try {
      await this.migrationService.revertLastMigration();
      return {
        message: 'Last migration reverted successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        message: 'Migration revert failed',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('status')
  async getMigrationStatus() {
    try {
      const status = await this.migrationService.showMigrations();
      return {
        message: 'Migration status retrieved successfully',
        data: status,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        message: 'Failed to get migration status',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
