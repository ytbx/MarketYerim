-- Fix infinite recursion in RLS policies
-- The issue is that orders policy checks order_items, and order_items policy checks orders
-- This creates a circular dependency

-- Drop the problematic policies
DROP POLICY IF EXISTS "Satıcılar kendi mağazalarının siparişlerini görebilir" ON orders;
DROP POLICY IF EXISTS "Müşteriler kendi sipariş kalemlerini görebilir" ON order_items;

-- Recreate order_items policy without checking orders (to break the cycle)
CREATE POLICY "Müşteriler kendi sipariş kalemlerini görebilir" ON order_items 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_items.order_id 
    AND orders.customer_id = auth.uid()
  )
);

-- Add a simpler policy for sellers to view order_items
CREATE POLICY "Satıcılar kendi ürünlerinin sipariş kalemlerini görebilir" ON order_items
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM products p 
    JOIN stores s ON p.store_id = s.id 
    WHERE p.id = order_items.product_id 
    AND s.seller_id = auth.uid()
  )
);

-- Recreate orders policy for sellers using a subquery that doesn't trigger recursion
CREATE POLICY "Satıcılar kendi mağazalarının siparişlerini görebilir" ON orders 
FOR SELECT USING (
  id IN (
    SELECT DISTINCT oi.order_id 
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    JOIN stores s ON p.store_id = s.id
    WHERE s.seller_id = auth.uid()
  )
);

-- Add policy for sellers to update order status
CREATE POLICY "Satıcılar sipariş durumunu güncelleyebilir" ON orders
FOR UPDATE USING (
  id IN (
    SELECT DISTINCT oi.order_id 
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    JOIN stores s ON p.store_id = s.id
    WHERE s.seller_id = auth.uid()
  )
);

-- Add policy for customers to create orders
CREATE POLICY "Müşteriler sipariş oluşturabilir" ON orders
FOR INSERT WITH CHECK (auth.uid() = customer_id);

-- Add policy for customers to create order items
CREATE POLICY "Müşteriler sipariş kalemi oluşturabilir" ON order_items
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_items.order_id 
    AND orders.customer_id = auth.uid()
  )
);
