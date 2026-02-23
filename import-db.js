const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function importDatabase() {
  const connection = await mysql.createConnection({
    host: 'tramway.proxy.rlwy.net',
    port: 53151,
    user: 'root',
    password: 'apIwNePzzbYjjTgkEHZgxoWJVFhkTOPi',
    database: 'railway',
    multipleStatements: true
  });

  console.log('Connected to Railway MySQL!');

  const sqlFile = fs.readFileSync(
    path.join('C:', 'Users', 'User', 'Downloads', 'wedding_bazaar.sql'),
    'utf8'
  );

  console.log('Importing SQL file...');
  
  try {
    await connection.query(sqlFile);
    console.log('Database imported successfully!');
  } catch (error) {
    console.error('Error importing:', error.message);
  }

  await connection.end();
}

importDatabase();
