const { DataSource } = require('typeorm');
require('dotenv').config();

const config = new DataSource({
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
});

module.exports = config;