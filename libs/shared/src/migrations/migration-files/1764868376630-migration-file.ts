import { MigrationInterface, QueryRunner } from "typeorm";

export class MigrationFile1764868376630 implements MigrationInterface {
    name = 'MigrationFile1764868376630'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`products\` (\`id\` varchar(36) NOT NULL, \`seller_id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`price\` decimal(10,2) NOT NULL, \`image_url\` varchar(500) NULL, \`is_available\` tinyint NOT NULL DEFAULT 1, \`description\` text NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`seller_sessions\` (\`id\` varchar(36) NOT NULL, \`seller_id\` varchar(36) NOT NULL, \`start_time\` datetime NOT NULL COMMENT 'Clock-in timestamp', \`end_time\` datetime NULL COMMENT 'Clock-out timestamp (null for active sessions)', \`total_distance_km\` float NOT NULL COMMENT 'Total distance traveled in km during session' DEFAULT '0', \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), INDEX \`idx_seller_id_start_time\` (\`seller_id\`, \`start_time\`), INDEX \`idx_seller_id_end_time\` (\`seller_id\`, \`end_time\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`seller_location_logs\` (\`id\` varchar(36) NOT NULL, \`seller_id\` varchar(36) NOT NULL, \`session_id\` varchar(36) NULL COMMENT 'Reference to work session (null if outside session)', \`recorded_at\` datetime NOT NULL COMMENT 'Timestamp of location record', \`location\` point NOT NULL COMMENT 'Geographic location (SRID 4326 - WGS84)', \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), INDEX \`idx_session_id_recorded_at\` (\`session_id\`, \`recorded_at\`), INDEX \`idx_seller_id_recorded_at\` (\`seller_id\`, \`recorded_at\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`sellers\` (\`id\` varchar(36) NOT NULL, \`user_id\` varchar(36) NOT NULL, \`store_name\` varchar(255) NOT NULL, \`description\` text NULL, \`category\` varchar(100) NULL, \`is_open\` tinyint NOT NULL DEFAULT 0, \`banner_url\` varchar(500) NULL, \`last_location\` point NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`REL_83f4670f0e114d0be3731bade8\` (\`user_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`users\` (\`id\` varchar(36) NOT NULL, \`email\` varchar(255) NOT NULL, \`password\` varchar(255) NOT NULL, \`full_name\` varchar(255) NOT NULL, \`phone_number\` varchar(20) NULL, \`role\` enum ('ADMIN', 'SELLER', 'BUYER') NOT NULL DEFAULT 'BUYER', \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`products\` ADD CONSTRAINT \`FK_425ee27c69d6b8adc5d6475dcfe\` FOREIGN KEY (\`seller_id\`) REFERENCES \`sellers\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`seller_sessions\` ADD CONSTRAINT \`FK_2689e9a7f30563678afc5e71a0a\` FOREIGN KEY (\`seller_id\`) REFERENCES \`sellers\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`seller_location_logs\` ADD CONSTRAINT \`FK_590156486d5510fac8db643ff2b\` FOREIGN KEY (\`seller_id\`) REFERENCES \`sellers\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`seller_location_logs\` ADD CONSTRAINT \`FK_ade577cc32cc921a5067f23cf38\` FOREIGN KEY (\`session_id\`) REFERENCES \`seller_sessions\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`sellers\` ADD CONSTRAINT \`FK_83f4670f0e114d0be3731bade87\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`sellers\` DROP FOREIGN KEY \`FK_83f4670f0e114d0be3731bade87\``);
        await queryRunner.query(`ALTER TABLE \`seller_location_logs\` DROP FOREIGN KEY \`FK_ade577cc32cc921a5067f23cf38\``);
        await queryRunner.query(`ALTER TABLE \`seller_location_logs\` DROP FOREIGN KEY \`FK_590156486d5510fac8db643ff2b\``);
        await queryRunner.query(`ALTER TABLE \`seller_sessions\` DROP FOREIGN KEY \`FK_2689e9a7f30563678afc5e71a0a\``);
        await queryRunner.query(`ALTER TABLE \`products\` DROP FOREIGN KEY \`FK_425ee27c69d6b8adc5d6475dcfe\``);
        await queryRunner.query(`DROP INDEX \`IDX_97672ac88f789774dd47f7c8be\` ON \`users\``);
        await queryRunner.query(`DROP TABLE \`users\``);
        await queryRunner.query(`DROP INDEX \`REL_83f4670f0e114d0be3731bade8\` ON \`sellers\``);
        await queryRunner.query(`DROP TABLE \`sellers\``);
        await queryRunner.query(`DROP INDEX \`idx_seller_id_recorded_at\` ON \`seller_location_logs\``);
        await queryRunner.query(`DROP INDEX \`idx_session_id_recorded_at\` ON \`seller_location_logs\``);
        await queryRunner.query(`DROP TABLE \`seller_location_logs\``);
        await queryRunner.query(`DROP INDEX \`idx_seller_id_end_time\` ON \`seller_sessions\``);
        await queryRunner.query(`DROP INDEX \`idx_seller_id_start_time\` ON \`seller_sessions\``);
        await queryRunner.query(`DROP TABLE \`seller_sessions\``);
        await queryRunner.query(`DROP TABLE \`products\``);
    }

}
