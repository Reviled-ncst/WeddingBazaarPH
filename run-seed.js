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

  // Sample images by category (using Unsplash)
  const categoryImages = {
    photography: [
      { url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80', filename: 'wedding-photo-1.jpg' },
      { url: 'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=800&q=80', filename: 'wedding-photo-2.jpg' }
    ],
    videography: [
      { url: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&q=80', filename: 'video-1.jpg' },
      { url: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&q=80', filename: 'video-2.jpg' }
    ],
    venue: [
      { url: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80', filename: 'venue-1.jpg' },
      { url: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&q=80', filename: 'venue-2.jpg' }
    ],
    catering: [
      { url: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=800&q=80', filename: 'catering-1.jpg' },
      { url: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&q=80', filename: 'catering-2.jpg' }
    ],
    florist: [
      { url: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&q=80', filename: 'florist-1.jpg' },
      { url: 'https://images.unsplash.com/photo-1561128290-005a1c395e4e?w=800&q=80', filename: 'florist-2.jpg' }
    ],
    'hair & makeup': [
      { url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80', filename: 'makeup-1.jpg' },
      { url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80', filename: 'makeup-2.jpg' }
    ],
    music: [
      { url: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800&q=80', filename: 'music-1.jpg' },
      { url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80', filename: 'music-2.jpg' }
    ]
  };

  // Update services with sample images
  console.log('Adding sample images to services...');
  const [services] = await connection.query(`SELECT id, category FROM services`);
  
  for (const service of services) {
    const images = categoryImages[service.category] || categoryImages.photography;
    await connection.query(
      `UPDATE services SET images = ? WHERE id = ?`,
      [JSON.stringify(images), service.id]
    );
  }
  console.log(`Updated ${services.length} services with sample images`);

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
  const [verifyServices] = await connection.query(`
    SELECT s.id, s.name, s.category, v.business_name, s.base_total, 
           JSON_LENGTH(s.pricing_items) as pricing_count,
           JSON_LENGTH(s.inclusions) as inclusions_count,
           s.max_bookings_per_day,
           s.images
    FROM services s
    JOIN vendors v ON s.vendor_id = v.id
    LIMIT 10
  `);
  
  console.log('\nServices verification:');
  verifyServices.forEach(s => {
    const hasImages = s.images && s.images !== 'null' && s.images !== '[]';
    console.log(`  ${s.name} (${s.business_name}): ₱${s.base_total}, ${s.pricing_count} items, ${s.inclusions_count} inclusions, max ${s.max_bookings_per_day}/day, images: ${hasImages ? 'YES' : 'NO'}`);
  });

  await connection.end();
}

runSeed();
