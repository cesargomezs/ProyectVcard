require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ Error de conexión:', err);
    } else {
        console.log('✅ ¡Conexión exitosa a PostgreSQL! Hora del servidor:', res.rows[0].now);
    }
    pool.end();
});