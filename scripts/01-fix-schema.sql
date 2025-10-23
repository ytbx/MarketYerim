-- Fix products table to include images column if missing
DO $$ 
BEGIN
  -- Add images column as TEXT array if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'images'
  ) THEN
    ALTER TABLE products ADD COLUMN images TEXT[] DEFAULT '{}';
  END IF;
END $$;

-- Ensure orders table has proper foreign key to addresses
DO $$
BEGIN
  -- Add shipping_address_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'shipping_address_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN shipping_address_id UUID REFERENCES addresses(id);
  END IF;
END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_orders_shipping_address_id ON orders(shipping_address_id);
