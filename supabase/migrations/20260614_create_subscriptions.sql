-- Add SaaS subscription columns to perumahan table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='perumahan' AND column_name='subscription_status') THEN
        ALTER TABLE public.perumahan ADD COLUMN subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'suspended', 'expired'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='perumahan' AND column_name='subscription_plan') THEN
        ALTER TABLE public.perumahan ADD COLUMN subscription_plan TEXT DEFAULT 'trial' CHECK (subscription_plan IN ('trial', 'monthly', 'yearly'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='perumahan' AND column_name='subscription_valid_until') THEN
        ALTER TABLE public.perumahan ADD COLUMN subscription_valid_until TIMESTAMPTZ DEFAULT (now() + interval '30 days');
    END IF;
END $$;
