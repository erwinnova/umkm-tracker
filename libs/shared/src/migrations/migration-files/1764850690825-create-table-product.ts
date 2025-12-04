import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTableProduct1764850690825 implements MigrationInterface {
  name = 'CreateTableProduct1764850690825';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`products\` (\`id\` varchar(36) NOT NULL, \`seller_id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`price\` decimal(10,2) NOT NULL, \`image_url\` varchar(500) NULL, \`is_available\` tinyint NOT NULL DEFAULT 1, \`description\` text NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`products\` ADD CONSTRAINT \`FK_425ee27c69d6b8adc5d6475dcfe\` FOREIGN KEY (\`seller_id\`) REFERENCES \`sellers\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`products\` DROP FOREIGN KEY \`FK_425ee27c69d6b8adc5d6475dcfe\``,
    );
    await queryRunner.query(`DROP TABLE \`products\``);
  }
}
