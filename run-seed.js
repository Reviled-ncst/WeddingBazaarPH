const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runSeed() {
  const connection = await mysql.createConnection({
    host: 'tramway.proxy.rlwy.net',
    port: 53151,
    user: 'root',
    password: 'apIwNePzzbYjjTgkEHZgxoWJVFhkTOPi',
    database: 'railway',
    multipleStatements: true
  });

  console.log('Connected to Railway MySQL!');

  // Check if guest_count column exists
  const [columns] = await connection.query(`
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'railway' AND TABLE_NAME = 'bookings' AND COLUMN_NAME = 'guest_count'
  `);
  
  if (columns.length === 0) {
    console.log('Adding guest_count columns to bookings...');
    try {
      await connection.query(`ALTER TABLE bookings ADD COLUMN guest_count INT DEFAULT NULL`);
      await connection.query(`ALTER TABLE bookings ADD COLUMN event_address VARCHAR(500) DEFAULT NULL`);
      await connection.query(`ALTER TABLE bookings ADD COLUMN travel_fee DECIMAL(10,2) DEFAULT 0`);
      await connection.query(`ALTER TABLE bookings ADD COLUMN event_lat DECIMAL(10,8) DEFAULT NULL`);
      await connection.query(`ALTER TABLE bookings ADD COLUMN event_lng DECIMAL(11,8) DEFAULT NULL`);
      console.log('Columns added!');
    } catch (error) {
      console.log('Migration note:', error.message);
    }
  } else {
    console.log('guest_count column already exists');
  }

  // Run the services pricing seed
  const seedFile = fs.readFileSync(
    path.join(__dirname, 'api', 'config', 'seed_services_pricing.sql'),
    'utf8'
  );

  console.log('Seeding services with pricing data...');
  
  try {
    await connection.query(seedFile);
    console.log('Services seeded successfully!');
  } catch (error) {
    console.error('Seed error:', error.message);
  }

  // Verify the data
  const [services] = await connection.query(`
    SELECT s.id, s.name, v.business_name, s.base_total, 
           JSON_LENGTH(s.pricing_items) as pricing_count,
           JSON_LENGTH(s.inclusions) as inclusions_count,
           s.max_bookings_per_day
    FROM services s
    JOIN vendors v ON s.vendor_id = v.id
    LIMIT 10
  `);
  
  console.log('\nServices verification:');
  services.forEach(s => {
    console.log(`  ${s.name} (${s.business_name}): ₱${s.base_total}, ${s.pricing_count} items, ${s.inclusions_count} inclusions, max ${s.max_bookings_per_day}/day`);
  });

  await connection.end();
}

runSeed();
