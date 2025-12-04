import * as bcrypt from 'bcrypt';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class InsertTestUsers1640000000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    try {
      // Hash passwords
      const passwordHash1 = await bcrypt.hash('password123', 10);
      const passwordHash2 = await bcrypt.hash('password123', 10);
      const passwordHash3 = await bcrypt.hash('password123', 10);

      // Insert test users
      await queryRunner.query(
        `
        INSERT INTO users (id, email, password, name, created_at, updated_at) 
        VALUES 
          ('550e8400-e29b-41d4-a716-446655440001', 'seller@umkm.com', $1, 'Test UMKM Seller', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
          ('550e8400-e29b-41d4-a716-446655440002', 'shop@umkm.com', $2, 'UMKM Shop Owner', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
          ('550e8400-e29b-41d4-a716-446655440003', 'admin@umkm.com', $3, 'UMKM Admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (email) DO NOTHING;
      `,
        [passwordHash1, passwordHash2, passwordHash3],
      );

      console.log('Test users inserted successfully');
    } catch (error) {
      console.error('Error inserting test users:', error);
      throw error;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    try {
      // Remove test users
      await queryRunner.query(`
        DELETE FROM users 
        WHERE email IN ('seller@umkm.com', 'shop@umkm.com', 'admin@umkm.com')
      `);

      console.log('Test users removed successfully');
    } catch (error) {
      console.error('Error removing test users:', error);
      throw error;
    }
  }
}
