-- ============================================
-- Supabase Setup - Safe Version (بدون DROP)
-- نسخة آمنة بدون حذف
-- ============================================

-- ============================================
-- PART 1: Create Tables
-- ============================================

CREATE TABLE IF NOT EXISTS admin_faces (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  descriptor JSONB NOT NULL,
  image_url TEXT NOT NULL,
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_faces_active ON admin_faces(active);
CREATE INDEX IF NOT EXISTS idx_admin_faces_registered_at ON admin_faces(registered_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_faces_name ON admin_faces(name);

COMMENT ON TABLE admin_faces IS 'Stores registered admin faces for face recognition authentication';

-- ============================================

CREATE TABLE IF NOT EXISTS unauthorized_access_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  distance NUMERIC(5,2),
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_unauthorized_timestamp ON unauthorized_access_attempts(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_unauthorized_ip ON unauthorized_access_attempts(ip_address);

COMMENT ON TABLE unauthorized_access_attempts IS 'Logs unauthorized access attempts with captured face images';

-- ============================================
-- PART 2: Enable RLS
-- ============================================

ALTER TABLE admin_faces ENABLE ROW LEVEL SECURITY;
ALTER TABLE unauthorized_access_attempts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PART 3: RLS Policies
-- ملاحظة: إذا كانت Policies موجودة، سيظهر خطأ - تجاهله
-- ============================================

CREATE POLICY "Allow all operations on admin_faces"
  ON admin_faces
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on unauthorized_access_attempts"
  ON unauthorized_access_attempts
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- PART 4: Functions & Triggers
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_admin_faces_updated_at
  BEFORE UPDATE ON admin_faces
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Verification
-- ============================================

SELECT 'Tables created successfully!' as status;

SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('admin_faces', 'unauthorized_access_attempts');

-- ✅ تم!
