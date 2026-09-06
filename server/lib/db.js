/* A single shared Postgres pool, reused across warm serverless invocations
   rather than opened fresh on every request. */
const { Pool } = require('pg');

let pool = null;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false } // required by most hosted Postgres (Neon, etc.)
    });
  }
  return pool;
}

module.exports = { getPool };
