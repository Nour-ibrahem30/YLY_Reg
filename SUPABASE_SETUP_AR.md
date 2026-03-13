# 🚀 إعداد Supabase لنظام التعرف على الوجه

## 📋 الخطوات

### 1. إنشاء الجداول في Supabase

1. اذهب إلى [Supabase Dashboard](https://app.supabase.com)
2. اختر مشروعك
3. اذهب إلى **SQL Editor**
4. انسخ محتوى ملف `supabase_tables.sql`
5. الصق في SQL Editor
6. اضغط **Run**

### 2. التحقق من الجداول

اذهب إلى **Table Editor** وتأكد من وجود:

#### ✅ الجدول الأول: `admin_faces`
```
Columns:
- id (UUID, Primary Key)
- name (TEXT)
- descriptor (JSONB) - 128 رقم
- image_url (TEXT)
- registered_at (TIMESTAMPTZ)
- active (BOOLEAN)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

#### ✅ الجدول الثاني: `unauthorized_access_attempts`
```
Columns:
- id (UUID, Primary Key)
- image_url (TEXT)
- timestamp (TIMESTAMPTZ)
- distance (NUMERIC)
- user_agent (TEXT)
- ip_address (TEXT)
- created_at (TIMESTAMPTZ)
```

### 3. إعداد متغيرات البيئة

أنشئ ملف `.env.local` في جذر المشروع:

```env
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
```

#### كيفية الحصول على المفاتيح:

1. اذهب إلى Supabase Dashboard
2. اختر مشروعك
3. اذهب إلى **Settings** → **API**
4. انسخ:
   - **Project URL** → `REACT_APP_SUPABASE_URL`
   - **anon public** key → `REACT_APP_SUPABASE_ANON_KEY`

### 4. التحقق من RLS Policies

اذهب إلى **Authentication** → **Policies**

تأكد من وجود:

#### للجدول `admin_faces`:
```sql
Policy: "Allow all operations on admin_faces"
Target: ALL
Using: true
With Check: true
```

#### للجدول `unauthorized_access_attempts`:
```sql
Policy: "Allow all operations on unauthorized_access_attempts"
Target: ALL
Using: true
With Check: true
```

### 5. اختبار الاتصال

في Console المتصفح (F12):

```javascript
// Test Supabase connection
import { supabase } from './utils/supabase';

const testConnection = async () => {
  const { data, error } = await supabase
    .from('admin_faces')
    .select('count');
  
  if (error) {
    console.error('❌ Connection failed:', error);
  } else {
    console.log('✅ Connected to Supabase!');
  }
};

testConnection();
```

## 🔧 حل المشاكل

### المشكلة 1: "relation does not exist"
**الحل**: تأكد من تشغيل SQL في SQL Editor

### المشكلة 2: "permission denied"
**الحل**: تحقق من RLS Policies

### المشكلة 3: "Supabase not configured"
**الحل**: تأكد من ملف `.env.local` وأعد تشغيل التطبيق

## 📊 هيكل البيانات

### بعد تسجيل أول أدمن:

```json
admin_faces:
{
  "id": "uuid",
  "name": "أحمد محمد",
  "descriptor": [128 أرقام],
  "image_url": "data:image/jpeg;base64,...",
  "registered_at": "2024-03-13T...",
  "active": true
}
```

### بعد محاولة دخول فاشلة:

```json
unauthorized_access_attempts:
{
  "id": "uuid",
  "image_url": "data:image/jpeg;base64,...",
  "timestamp": "2024-03-13T...",
  "distance": 0.85,
  "user_agent": "Mozilla/5.0...",
  "ip_address": "192.168.1.1"
}
```

## 🔒 تأمين الإنتاج

### RLS Policies المحسّنة:

```sql
-- Admin Faces - قراءة للجميع، كتابة للمصادقين فقط
CREATE POLICY "Allow read for all"
  ON admin_faces FOR SELECT
  USING (true);

CREATE POLICY "Allow insert for authenticated"
  ON admin_faces FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Unauthorized Attempts - كتابة للجميع، قراءة للمصادقين فقط
CREATE POLICY "Allow insert for all"
  ON unauthorized_access_attempts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow read for authenticated"
  ON unauthorized_access_attempts FOR SELECT
  USING (auth.role() = 'authenticated');
```

## ✅ Checklist

- [ ] تم إنشاء الجداول في Supabase
- [ ] تم إعداد RLS Policies
- [ ] تم إضافة متغيرات البيئة في `.env.local`
- [ ] تم اختبار الاتصال بنجاح
- [ ] لا توجد أخطاء في Console

## 🚀 الخطوات التالية

### (اختياري) إعداد Storage للصور

النظام الحالي يحفظ الصور كـ base64 في قاعدة البيانات. إذا أردت استخدام Supabase Storage بدلاً من ذلك:

1. شغّل `supabase_storage.sql` في SQL Editor
2. عدّل `src/services/faceRecognitionService.js` لاستخدام Storage

**ملاحظة**: Base64 أبسط ويعمل مباشرة. Storage أفضل لعدد كبير من الصور.

### رفع التطبيق

1. ارفع التطبيق:
   ```bash
   npm run build
   git add .
   git commit -m "Switch to Supabase for face recognition"
   git push
   ```

2. أضف متغيرات البيئة في Vercel:
   - اذهب إلى Vercel Dashboard
   - اختر مشروعك
   - Settings → Environment Variables
   - أضف:
     - `REACT_APP_SUPABASE_URL`
     - `REACT_APP_SUPABASE_ANON_KEY`

3. أعد نشر التطبيق في Vercel

---

**جاهز للاستخدام!** 🎉
