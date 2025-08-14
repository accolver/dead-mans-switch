-- Add BTCPay-related columns and crypto_payments table

-- user_subscriptions already provider-agnostic; ensure indexes for provider fields exist
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_provider ON public.user_subscriptions(provider);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_provider_subscription_id ON public.user_subscriptions(provider_subscription_id);

-- Create crypto_payments table for one-time Bitcoin payments
CREATE TABLE IF NOT EXISTS public.crypto_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  btcpay_invoice_id TEXT UNIQUE NOT NULL,
  amount_btc DECIMAL(16,8) NOT NULL,
  amount_fiat DECIMAL(10,2) NOT NULL,
  fiat_currency TEXT NOT NULL DEFAULT 'USD',
  exchange_rate DECIMAL(16,8) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'expired')),
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_crypto_payments_user_id ON public.crypto_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_crypto_payments_invoice_id ON public.crypto_payments(btcpay_invoice_id);
CREATE INDEX IF NOT EXISTS idx_crypto_payments_status ON public.crypto_payments(status);

-- RLS
ALTER TABLE public.crypto_payments ENABLE ROW LEVEL SECURITY;

-- Allow users to see their own payments
CREATE POLICY IF NOT EXISTS "Users can view own crypto payments" ON public.crypto_payments
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Allow users to insert their own payment records (server functions should do this in practice)
CREATE POLICY IF NOT EXISTS "Users can insert own crypto payments" ON public.crypto_payments
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own payment records (e.g., status updates from functions)
CREATE POLICY IF NOT EXISTS "Users can update own crypto payments" ON public.crypto_payments
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

