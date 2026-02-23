-- Migration: Update services table to use pricing breakdown structure
-- Run this to update the existing services table

-- Add new columns
ALTER TABLE services
ADD COLUMN pricing_items JSON AFTER category,
ADD COLUMN base_total DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER pricing_items;

-- Migrate existing data: Convert old pricing fields to new structure
-- This creates a single pricing item from the old base_price
UPDATE services SET 
    pricing_items = JSON_ARRAY(
        JSON_OBJECT(
            'id', UUID(),
            'description', 'Service Package',
            'quantity', 1,
            'unit', COALESCE(price_unit, 'package'),
            'rate', base_price,
            'total', base_price
        )
    ),
    base_total = base_price
WHERE pricing_items IS NULL AND base_price IS NOT NULL;

-- Drop old columns (run this after verifying migration worked)
-- ALTER TABLE services
-- DROP COLUMN price_type,
-- DROP COLUMN base_price,
-- DROP COLUMN max_price,
-- DROP COLUMN price_unit;

-- If you want to drop and recreate (for fresh start):
-- DROP TABLE IF EXISTS services;
-- Then run the full schema.sql
