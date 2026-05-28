-- Migration: Create audit_logs table

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    entity VARCHAR(255) NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Superadmins can read all logs
CREATE POLICY "Superadmins can read all audit logs" ON audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin'
        )
    );

-- System can insert logs (or admins can insert logs if they do actions)
CREATE POLICY "Users can insert audit logs" ON audit_logs
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL
    );
