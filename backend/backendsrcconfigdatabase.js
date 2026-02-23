const { Pool } = require('pg');
const { Sequelize } = require('sequelize');

// PostgreSQL connection pool for raw queries
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Sequelize ORM instance
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  dialectOptions: process.env.NODE_ENV === 'production' ? {
    ssl: { require: true, rejectUnauthorized: false }
  } : {},
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Test connection and initialize
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Initialize PostGIS
    await pool.query('CREATE EXTENSION IF NOT EXISTS postgis;');
    await pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    
    // Sync models (development only)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('✅ Models synchronized');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Closing database connections...');
  await sequelize.close();
  await pool.end();
});

module.exports = { pool, sequelize, testConnection };