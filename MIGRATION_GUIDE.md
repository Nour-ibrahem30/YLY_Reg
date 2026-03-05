# دليل الترحيل - Migration Guide

## نظام المصادقة الجديد

تم تحديث النظام ليستخدم هيكل قاعدة بيانات جديد مع نظام مصادقة بكلمة المرور.

### الهيكل الجديد:

1. **pending_registrations** - طلبات التسجيل المعلقة
   - يتم إضافة المستخدمين الجدد هنا
   - في انتظار موافقة الإدارة
   - تحتوي على: name, email, number, userId, governorate, committee, role, password, status, createdAt

2. **users** - المستخدمين المعتمدين
   - المستخدمين الذين تمت الموافقة عليهم
   - يمكنهم تسجيل الدخول
   - تحتوي على: name, email, number, userId, governorate, committee, role, password, status, approvedAt, createdAt

### التغييرات الرئيسية:

- ✅ تم تحديث Login.js للبحث في users collection
- ✅ تم تحديث RegistrationForm.js للإضافة في pending_registrations
- ✅ تم إنشاء PendingRegistrations.js لإدارة الموافقات
- ✅ تم تحديث Profile.js للقراءة من users collection
- ✅ تم تحديث QRScanner.js للبحث في users collection

### ملاحظات مهمة:

1. **المستخدمين الحاليين**: إذا كان لديك مستخدمين في collections المحافظات القديمة، ستحتاج لنقلهم يدوياً إلى users collection
2. **كلمات المرور**: المستخدمين الجدد يجب أن يسجلوا بكلمة مرور (6 أحرف على الأقل)
3. **الموافقة**: جميع التسجيلات الجديدة تحتاج موافقة الإدارة من صفحة `/admin/pending`

### خطوات الترحيل (اختياري):

إذا كنت تريد نقل المستخدمين الحاليين:

1. افتح Firebase Console
2. انتقل إلى Firestore Database
3. لكل مستخدم في collections المحافظات:
   - انسخ البيانات
   - أضفها في users collection
   - أضف حقل password (يمكن استخدام رقم الهوية كقيمة مؤقتة)
   - أضف حقل status: "approved"
   - أضف حقل approvedAt: التاريخ الحالي

### الوصول للبروفايل:

- **القديم**: `/profile/المحافظة/ID`
- **الجديد**: `/profile/المحافظة/ID` (نفس الشكل لكن يقرأ من users collection)

### نظام الموافقات:

1. المستخدم يسجل من `/register`
2. يتم إضافته في `pending_registrations`
3. الإدارة تذهب لـ `/admin/pending`
4. الإدارة تضغط "قبول" أو "رفض"
5. عند القبول: ينتقل المستخدم من `pending_registrations` إلى `users`
6. المستخدم يمكنه الآن تسجيل الدخول من `/`

### الأمان:

⚠️ **ملاحظة**: كلمات المرور حالياً مخزنة كنص عادي. في الإنتاج، يُنصح بشدة باستخدام:
- Firebase Authentication
- أو تشفير كلمات المرور باستخدام bcrypt أو مكتبة مشابهة
