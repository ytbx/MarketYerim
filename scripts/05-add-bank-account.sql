-- Add bank_account column to stores table
ALTER TABLE stores
ADD COLUMN IF NOT EXISTS bank_account TEXT;

-- Create function to handle payment transfer
CREATE OR REPLACE FUNCTION handle_payment_transfer()
RETURNS TRIGGER AS $$
DECLARE
    seller_account TEXT;
    store_name TEXT;
BEGIN
    -- Get seller's bank account from order items
    SELECT s.bank_account, s.name INTO seller_account, store_name
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    JOIN stores s ON p.store_id = s.id
    WHERE oi.order_id = NEW.order_id
    LIMIT 1;

    -- Log payment transfer information
    RAISE NOTICE 'Ödeme % TL mağaza "%" için hesap "%" aktarılacak', 
        NEW.amount, store_name, COALESCE(seller_account, 'Hesap bilgisi yok');

    -- Here you would integrate with a real payment API
    -- For example: Stripe Connect, PayPal, or Turkish payment gateways
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for payment transfers
DROP TRIGGER IF EXISTS trigger_handle_payment_transfer ON payments;
CREATE TRIGGER trigger_handle_payment_transfer
AFTER INSERT ON payments
FOR EACH ROW
EXECUTE FUNCTION handle_payment_transfer();

-- Add comment to explain the column
COMMENT ON COLUMN stores.bank_account IS 'IBAN or bank account number for receiving payments';
