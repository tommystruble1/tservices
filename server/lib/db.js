/* A single shared Postgres pool, reused across warm serverless invocations
   rather than opened fresh on every request. */
import pg from 'pg';

const { Pool } = pg;

let pool = null;

export function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false } // required by most hosted Postgres (Neon, etc.)
    });
  }
  return pool;
}
