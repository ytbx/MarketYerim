-- Add images column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';

-- Update existing products to have empty array if null
UPDATE products SET images = '{}' WHERE images IS NULL;

-- Add comment to column
COMMENT ON COLUMN products.images IS 'Array of image URLs stored in Supabase Storage';
