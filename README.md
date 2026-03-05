# YLY - نظام إدارة المتطوعين والفعاليات

نظام متكامل لإدارة المتطوعين والفعاليات باستخدام QR Code للحضور ورفع المهام.

## المميزات

### للمستخدمين
- ✅ تسجيل حساب جديد مع معلومات كاملة
- ✅ QR Code فريد لكل مستخدم
- ✅ عرض الفعاليات المتاحة
- ✅ رفع المهام (صور، PDF، Word)
- ✅ نظام النقاط والمكافآت
- ✅ متابعة حالة المهام المرفوعة

### للإدارة
- ✅ لوحة تحكم شاملة
- ✅ إدارة الفعاليات (إضافة، تعديل، حذف)
- ✅ ماسح QR Code للحضور
- ✅ سجلات الحضور الكاملة
- ✅ تصدير البيانات إلى Excel
- ✅ إحصائيات مفصلة

## التقنيات المستخدمة

- **Frontend:** React.js
- **Database:** Firebase Firestore
- **Storage:** Supabase Storage
- **UI:** Framer Motion, React Icons
- **QR Code:** qrcode.react, html5-qrcode

## نظام النقاط

- 🎯 **10 نقاط** - حضور فعالية
- 🎯 **20 نقطة** - رفع مهمة
- 🎯 **30 نقطة** - قبول المهمة

## التثبيت

### 1. استنساخ المشروع

```bash
git clone https://github.com/your-username/YLY_Reg.git
cd YLY_Reg
```

### 2. تثبيت المكتبات

```bash
npm install
```

### 3. إعداد Firebase

1. أنشئ مشروع جديد في [Firebase Console](https://console.firebase.google.com/)
2. فعّل Firestore Database
3. أنشئ 27 collection (واحد لكل محافظة)
4. انسخ إعدادات Firebase

### 4. إعداد Supabase

1. أنشئ مشروع جديد في [Supabase](https://supabase.com/)
2. اذهب إلى Storage وأنشئ bucket باسم `yly-tasks`
3. اجعل الـ bucket عام (Public)
4. أضف Storage Policies للسماح بالرفع والقراءة

### 5. ملف البيئة

أنشئ ملف `.env` في المجلد الرئيسي:

```env
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id

# Supabase Configuration
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 6. تشغيل المشروع

```bash
npm start
```

المشروع سيعمل على: `http://localhost:3000`

## هيكل المشروع

```
YLY_Reg/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── RegistrationForm.js      # صفحة التسجيل
│   │   ├── Profile.js               # صفحة البروفايل
│   │   ├── AdminDashboard.js        # لوحة تحكم الأدمن
│   │   ├── QRScanner.js             # ماسح QR
│   │   ├── EventsManagement.js      # إدارة الفعاليات
│   │   ├── AttendanceLogs.js        # سجلات الحضور
│   │   ├── UserEvents.js            # فعاليات المستخدم
│   │   └── UserTasks.js             # مهام المستخدم
│   ├── services/
│   │   ├── eventService.js          # خدمات الفعاليات
│   │   ├── attendanceService.js     # خدمات الحضور
│   │   ├── taskService.js           # خدمات المهام
│   │   └── pointsService.js         # خدمات النقاط
│   ├── utils/
│   │   ├── supabase.js              # إعدادات Supabase
│   │   └── qrScanner.js             # أدوات QR
│   ├── styles/
│   │   ├── QRScanner.css
│   │   ├── EventsManagement.css
│   │   ├── AttendanceLogs.css
│   │   └── UserEvents.css
│   ├── App.js
│   ├── App.css
│   ├── AdminStyles.css
│   └── firebase.js
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## الصفحات والمسارات

- `/` - صفحة التسجيل
- `/profile/:governorate/:id` - صفحة البروفايل
- `/admin` - لوحة تحكم الأدمن
- `/admin/scanner` - ماسح QR Code
- `/admin/events` - إدارة الفعاليات
- `/admin/attendance` - سجلات الحضور

## قواعد Firebase

للسماح بالقراءة والكتابة، أضف هذه القواعد في Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{governorate}/{document=**} {
      allow read, write: if true;
    }
    match /events/{document=**} {
      allow read, write: if true;
    }
    match /attendance/{document=**} {
      allow read, write: if true;
    }
    match /tasks/{document=**} {
      allow read, write: if true;
    }
    match /userPoints/{document=**} {
      allow read, write: if true;
    }
  }
}
```

**ملاحظة:** هذه قواعد للتطوير فقط. في الإنتاج، استخدم قواعد أكثر أماناً.

## Supabase Storage Policies

```sql
-- السماح بالرفع
CREATE POLICY "Allow uploads"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'yly-tasks');

-- السماح بالقراءة
CREATE POLICY "Allow public reads"
ON storage.objects
FOR SELECT
USING (bucket_id = 'yly-tasks');

-- السماح بالحذف
CREATE POLICY "Allow deletes"
ON storage.objects
FOR DELETE
USING (bucket_id = 'yly-tasks');
```

## المحافظات المدعومة

النظام يدعم 27 محافظة مصرية:
- القاهرة، الجيزة، الإسكندرية، الدقهلية، البحر الأحمر
- البحيرة، الفيوم، الغربية، الإسماعيلية، المنوفية
- المنيا، القليوبية، الوادي الجديد، الشرقية، السويس
- أسوان، أسيوط، بني سويف، بورسعيد، دمياط
- الأقصر، قنا، كفر الشيخ، مطروح، شمال سيناء
- جنوب سيناء، سوهاج

## اللجان المتاحة

- PR (العلاقات العامة)
- HR (الموارد البشرية)
- R&D (البحث والتطوير)
- Social Media (التواصل الاجتماعي)
- OR (العمليات)

## الأدوار الوظيفية

- Head (رئيس)
- Vice Head (نائب الرئيس)
- Team Leader (قائد فريق)
- Vice Team Leader (نائب قائد الفريق)
- Member (عضو)

## النشر

### Vercel

```bash
npm run build
vercel --prod
```

### Firebase Hosting

```bash
npm run build
firebase deploy
```

## المساهمة

المساهمات مرحب بها! يرجى فتح Issue أو Pull Request.

## الترخيص

هذا المشروع مفتوح المصدر ومتاح للاستخدام الحر.

## الدعم

للدعم والاستفسارات، يرجى فتح Issue في GitHub.

---

**تم التطوير بواسطة:** YLY Team
**السنة:** 2026
