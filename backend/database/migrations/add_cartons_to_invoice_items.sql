-- Add optional cartons to invoice line items (1 carton = pairs_per_carton, default 8)
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS cartons INTEGER DEFAULT NULL;
