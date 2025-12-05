// src/db/data-source.ts
import { ConfigModule } from '@nestjs/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import { SeederOptions } from 'typeorm-extension';

ConfigModule.forRoot({
  envFilePath: '.env',
});

export const dataSourceOptions: DataSourceOptions & SeederOptions = {
  type: 'mariadb',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  // Improved entity loading pattern to avoid barrel exports and index files
  // Only load .entity.ts and .entity.js files, skip index.ts
  entities: [__dirname + '/../entities/**/*.entity{.ts,.js}'],
  seeds: ['../seed/**/*{.ts,.js}'],
  factories: [__dirname + '../factories/**/*{.ts,.js}'],
  synchronize: false, // do not set it true in production application
  migrationsTableName: 'migration_history',
  migrations: [__dirname + '/migration-files/**/*{.ts,.js}'],
};

export default new DataSource(dataSourceOptions);
