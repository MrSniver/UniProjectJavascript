require('dotenv').config(); 
const { Pool } = require('pg'); 
const pool = new Pool({ 
host: process.env.DB_HOST, 
port: process.env.DB_PORT, 
database: process.env.DB_NAME, 
user: process.env.DB_USER,
password: process.env.DB_PASSWORD, 
ssl: { rejectUnauthorized: false } 
}); 
pool.query('SELECT NOW() as time, version() as version', (err, res) => { 
if (err) { 
console.error('❌ Błąd połączenia:', err.message); 
  } 
else { 
console.log('✅ Połączono z RDS PostgreSQL!'); 
console.log('Czas serwera:', res.rows[0].time); 
console.log('Wersja:', res.rows[0].version); 
  } 
  pool.end(); 
});