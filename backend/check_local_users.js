import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/aura'
});

async function check() {
  try {
    const res = await pool.query('SELECT * FROM users');
    console.log(`FOUND ${res.rows.length} USERS IN LOCAL DB`);
    res.rows.forEach(u => {
      console.log(`- ${u.id}: ${u.name} (${u.email || 'no email'})`);
    });
  } catch (err) {
    console.error(`ERROR: ${err.message}`);
  } finally {
    await pool.end();
  }
}

check();
