-- 1. Create disbursements table
CREATE TABLE IF NOT EXISTS public.disbursements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    perumahan_id UUID REFERENCES public.perumahan(id) ON DELETE CASCADE,
    amount BIGINT NOT NULL,          -- Net cash payout amount transferred to perumahan bank
    admin_fee BIGINT NOT NULL,       -- Admin fee cut by platform during payout
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Disbursed')),
    reference_no TEXT,               -- Payout bank transfer receipt number
    created_at TIMESTAMPTZ DEFAULT now(),
    disbursed_at TIMESTAMPTZ
);

-- 2. Add tracking and admin fee columns to tagihan
ALTER TABLE public.tagihan ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'Manual';
ALTER TABLE public.tagihan ADD COLUMN IF NOT EXISTS payment_ref TEXT;
ALTER TABLE public.tagihan ADD COLUMN IF NOT EXISTS admin_fee BIGINT DEFAULT 0;
ALTER TABLE public.tagihan ADD COLUMN IF NOT EXISTS net_amount BIGINT DEFAULT 0;
ALTER TABLE public.tagihan ADD COLUMN IF NOT EXISTS disbursement_id UUID REFERENCES public.disbursements(id) ON DELETE SET NULL;

-- 3. Enable RLS on disbursements
ALTER TABLE public.disbursements ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for disbursements
DROP POLICY IF EXISTS "Super admin full access disbursements" ON public.disbursements;
CREATE POLICY "Super admin full access disbursements" ON public.disbursements 
    FOR ALL USING (public.get_user_role() = 'super_admin');

DROP POLICY IF EXISTS "Tenant read disbursements" ON public.disbursements;
CREATE POLICY "Tenant read disbursements" ON public.disbursements 
    FOR SELECT USING (
        perumahan_id = public.get_user_perumahan_id() OR
        public.get_user_role() = 'super_admin'
      );

-- 5. Seed default Pakasir API Config in system_settings
INSERT INTO public.system_settings (key, value, description)
VALUES 
    ('pakasir_slug', 'habitix', 'Slug for Pakasir integration (Global)'),
    ('pakasir_api_key', 'cuTCvuY8btAUMyaBTtbUfW4gUe5qaxUJ', 'API Key for Pakasir integration (Global)')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
