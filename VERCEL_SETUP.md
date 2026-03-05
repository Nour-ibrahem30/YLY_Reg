# إعداد Vercel Environment Variables

## الخطوات:

### 1. اذهب إلى Vercel Dashboard
```
https://vercel.com/your-username/yly-reg/settings/environment-variables
```

### 2. أضف المتغيرات التالية:

#### Firebase Configuration:
```
REACT_APP_FIREBASE_API_KEY = your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN = your_firebase_auth_domain  
REACT_APP_FIREBASE_PROJECT_ID = your_firebase_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET = your_firebase_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID = your_firebase_sender_id
REACT_APP_FIREBASE_APP_ID = your_firebase_app_id
```

#### Supabase Configuration:
```
REACT_APP_SUPABASE_URL = https://zidakvdpucmdotxdrfcs.supabase.co
REACT_APP_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppZGFrdmRwdWNtZG90eGRyZmNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3MzYwNzcsImV4cCI6MjA4ODMxMjA3N30.XDvftpBlrneSzqHYELvL0u1afNEVsI_5ypEtLFv5FZE
```

### 3. اختر Environment:
- ✅ Production
- ✅ Preview  
- ✅ Development

### 4. احفظ وأعد النشر:
- اضغط **Save**
- اذهب إلى **Deployments**
- اضغط على آخر deployment
- اضغط **Redeploy**

## أو استخدم Vercel CLI:

```bash
# تثبيت Vercel CLI
npm i -g vercel

# تسجيل الدخول
vercel login

# ربط المشروع
vercel link

# إضافة المتغيرات
vercel env add REACT_APP_SUPABASE_URL
vercel env add REACT_APP_SUPABASE_ANON_KEY
vercel env add REACT_APP_FIREBASE_API_KEY
vercel env add REACT_APP_FIREBASE_AUTH_DOMAIN
vercel env add REACT_APP_FIREBASE_PROJECT_ID
vercel env add REACT_APP_FIREBASE_STORAGE_BUCKET
vercel env add REACT_APP_FIREBASE_MESSAGING_SENDER_ID
vercel env add REACT_APP_FIREBASE_APP_ID

# إعادة النشر
vercel --prod
```

## ملاحظات:
- تأكد من نسخ القيم الصحيحة من Firebase Console
- الـ Supabase Keys موجودة في الملف أعلاه
- بعد الإضافة، المشروع يحتاج Redeploy
