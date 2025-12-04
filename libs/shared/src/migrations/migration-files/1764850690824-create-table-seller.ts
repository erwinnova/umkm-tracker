import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTableSeller1764850690824 implements MigrationInterface {
  name = 'CreateTableSeller1764850690824';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`sellers\` (\`id\` varchar(36) NOT NULL, \`user_id\` varchar(36) NOT NULL, \`store_name\` varchar(255) NOT NULL, \`description\` text NULL, \`category\` varchar(100) NULL, \`is_open\` tinyint NOT NULL DEFAULT 0, \`banner_url\` varchar(500) NULL, \`last_location\` point NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`REL_83f4670f0e114d0be3731bade8\` (\`user_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`sellers\` ADD CONSTRAINT \`FK_83f4670f0e114d0be3731bade87\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`sellers\` DROP FOREIGN KEY \`FK_83f4670f0e114d0be3731bade87\``,
    );
    await queryRunner.query(
      `DROP INDEX \`REL_83f4670f0e114d0be3731bade8\` ON \`sellers\``,
    );
    await queryRunner.query(`DROP TABLE \`sellers\``);
  }
}
