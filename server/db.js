const { Pool } = require('pg');

// Use connection string from environment variables
const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString,
  ssl: {
    require: true,
    rejectUnauthorized: false
  }
});

// Test connection on startup
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection error:', err);
  } else {
    console.log('✅ Connected to PostgreSQL database');
    console.log('📅 Current time from DB:', res.rows[0].now);
  }
});

module.exports = pool;