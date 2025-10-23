-- Fix the get_seller_monthly_sales function to bypass RLS policies
-- This prevents infinite recursion when querying orders and order_items

DROP FUNCTION IF EXISTS get_seller_monthly_sales(UUID, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION get_seller_monthly_sales(seller_uuid UUID, year INTEGER, month INTEGER)
RETURNS TABLE(day_date DATE, daily_sales DECIMAL(10,2), total_orders BIGINT) 
SECURITY DEFINER -- This makes the function run with the privileges of the function owner, bypassing RLS
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE(o.created_at) as day_date,
    SUM(oi.quantity * oi.price) as daily_sales,
    COUNT(DISTINCT o.id) as total_orders
  FROM orders o
  JOIN order_items oi ON o.id = oi.order_id
  JOIN products p ON oi.product_id = p.id
  JOIN stores s ON p.store_id = s.id
  WHERE s.seller_id = seller_uuid
    AND EXTRACT(YEAR FROM o.created_at) = year
    AND EXTRACT(MONTH FROM o.created_at) = month
    AND o.status != 'cancelled'
  GROUP BY DATE(o.created_at)
  ORDER BY day_date;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_seller_monthly_sales(UUID, INTEGER, INTEGER) TO authenticated;
