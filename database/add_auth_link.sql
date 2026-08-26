-- Link customers to Supabase auth users
ALTER TABLE customers ADD COLUMN IF NOT EXISTS auth_user_id UUID UNIQUE;
CREATE INDEX IF NOT EXISTS idx_customers_auth_user_id ON customers(auth_user_id);
