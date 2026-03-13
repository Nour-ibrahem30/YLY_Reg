-- ============================================
-- Supabase Complete Setup for Face Recognition System
-- نظام التعرف على الوجه - الإعداد الكامل
-- ============================================

-- ============================================
-- PART 1: Create Tables (الجداول)
-- ============================================

-- Table 1: Admin Faces
-- جدول وجوه الأدمن المسجلة
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

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_admin_faces_active ON admin_faces(active);
CREATE INDEX IF NOT EXISTS idx_admin_faces_registered_at ON admin_faces(registered_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_faces_name ON admin_faces(name);

-- Add comment
COMMENT ON TABLE admin_faces IS 'Stores registered admin faces for face recognition authentication';
COMMENT ON COLUMN admin_faces.descriptor IS 'Face descriptor array (128 numbers)';
COMMENT ON COLUMN admin_faces.image_url IS 'Base64 encoded face image';

-- ============================================

-- Table 2: Unauthorized Access Attempts
-- جدول محاولات الدخول غير المصرح بها
CREATE TABLE IF NOT EXISTS unauthorized_access_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  distance NUMERIC(5,2),
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_unauthorized_timestamp ON unauthorized_access_attempts(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_unauthorized_ip ON unauthorized_access_attempts(ip_address);

-- Add comment
COMMENT ON TABLE unauthorized_access_attempts IS 'Logs unauthorized access attempts with captured face images';
COMMENT ON COLUMN unauthorized_access_attempts.distance IS 'Face matching distance (0-1, lower is better match)';

-- ============================================
-- PART 2: Enable Row Level Security (RLS)
-- تفعيل أمان الصفوف
-- ============================================

ALTER TABLE admin_faces ENABLE ROW LEVEL SECURITY;
ALTER TABLE unauthorized_access_attempts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PART 3: RLS Policies (سياسات الأمان)
-- ============================================

-- Policies for admin_faces
-- السماح بجميع العمليات (للتطوير)
DROP POLICY IF EXISTS "Allow all operations on admin_faces" ON admin_faces;
CREATE POLICY "Allow all operations on admin_faces"
  ON admin_faces
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Policies for unauthorized_access_attempts
-- السماح بجميع العمليات (للتطوير)
DROP POLICY IF EXISTS "Allow all operations on unauthorized_access_attempts" ON unauthorized_access_attempts;
CREATE POLICY "Allow all operations on unauthorized_access_attempts"
  ON unauthorized_access_attempts
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- PART 4: Functions & Triggers (الدوال والمحفزات)
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for admin_faces
DROP TRIGGER IF EXISTS update_admin_faces_updated_at ON admin_faces;
CREATE TRIGGER update_admin_faces_updated_at
  BEFORE UPDATE ON admin_faces
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- PART 5: Storage Bucket (مطلوب)
-- ============================================
-- ملاحظة: هذا ينشئ bucket جديد بدون المساس بالـ buckets الموجودة

-- Create NEW storage bucket for face recognition images ONLY
INSERT INTO storage.buckets (id, name, public)
VALUES ('face-recognition', 'face-recognition', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public uploads to face-recognition bucket
CREATE POLICY "Allow public uploads to face-recognition"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'face-recognition');

-- Allow public reads from face-recognition bucket
CREATE POLICY "Allow public reads from face-recognition"
ON storage.objects FOR SELECT
USING (bucket_id = 'face-recognition');

-- Allow public deletes from face-recognition bucket
CREATE POLICY "Allow public deletes from face-recognition"
ON storage.objects FOR DELETE
USING (bucket_id = 'face-recognition');

-- ============================================
-- PART 6: Verification Queries (استعلامات التحقق)
-- ============================================

-- Check if tables exist
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('admin_faces', 'unauthorized_access_attempts')
ORDER BY table_name;

-- Check indexes
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('admin_faces', 'unauthorized_access_attempts')
ORDER BY tablename, indexname;

-- Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('admin_faces', 'unauthorized_access_attempts')
ORDER BY tablename, policyname;

-- ============================================
-- PART 7: Sample Queries (استعلامات مفيدة)
-- ============================================

-- عرض جميع الأدمن المسجلين
-- SELECT id, name, registered_at, active FROM admin_faces ORDER BY registered_at DESC;

-- عرض آخر 10 محاولات دخول فاشلة
-- SELECT id, timestamp, ip_address, distance FROM unauthorized_access_attempts ORDER BY timestamp DESC LIMIT 10;

-- عدد الأدمن المسجلين
-- SELECT COUNT(*) as total_admins FROM admin_faces WHERE active = true;

-- عدد المحاولات الفاشلة اليوم
-- SELECT COUNT(*) as attempts_today FROM unauthorized_access_attempts WHERE DATE(timestamp) = CURRENT_DATE;

-- عدد المحاولات الفاشلة لكل IP
-- SELECT ip_address, COUNT(*) as attempts FROM unauthorized_access_attempts GROUP BY ip_address ORDER BY attempts DESC LIMIT 10;

-- حذف المحاولات الأقدم من 30 يوم
-- DELETE FROM unauthorized_access_attempts WHERE timestamp < NOW() - INTERVAL '30 days';

-- ============================================
-- PART 8: Production Security (للإنتاج - اختياري)
-- ============================================
-- للإنتاج، يمكنك استخدام سياسات أمان أكثر صرامة:

/*
-- حذف السياسات الحالية
DROP POLICY IF EXISTS "Allow all operations on admin_faces" ON admin_faces;
DROP POLICY IF EXISTS "Allow all operations on unauthorized_access_attempts" ON unauthorized_access_attempts;

-- سياسات admin_faces
-- القراءة للجميع
CREATE POLICY "Allow read for all"
  ON admin_faces FOR SELECT
  USING (true);

-- الكتابة للمصادقين فقط
CREATE POLICY "Allow insert for authenticated"
  ON admin_faces FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- التحديث للمصادقين فقط
CREATE POLICY "Allow update for authenticated"
  ON admin_faces FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- سياسات unauthorized_access_attempts
-- الكتابة للجميع (لتسجيل المحاولات)
CREATE POLICY "Allow insert for all"
  ON unauthorized_access_attempts FOR INSERT
  WITH CHECK (true);

-- القراءة للمصادقين فقط
CREATE POLICY "Allow read for authenticated"
  ON unauthorized_access_attempts FOR SELECT
  USING (auth.role() = 'authenticated');
*/

-- ============================================
-- NOTES (ملاحظات مهمة)
-- ============================================
-- 1. شغّل هذا الملف في Supabase SQL Editor
-- 2. تأكد من تفعيل RLS policies
-- 3. للإنتاج، استخدم سياسات أمان أكثر صرامة (PART 8)
-- 4. Storage bucket اختياري - النظام يستخدم base64 افتراضياً
-- 5. استعلامات التحقق (PART 6) تساعدك في التأكد من الإعداد
-- 6. استعلامات مفيدة (PART 7) لإدارة البيانات
-- ============================================

-- ✅ تم! الآن يمكنك استخدام نظام التعرف على الوجه
