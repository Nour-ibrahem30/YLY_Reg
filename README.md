# YLY Community Platform

موقع مجتمع Your Life Your Story - منصة لتسجيل الأعضاء وإنشاء ملفات تعريفية.

## المميزات

- نموذج تسجيل بسيط وسهل الاستخدام
- حفظ البيانات في Firebase Firestore
- صفحة بروفايل لكل عضو
- QR Code مخصص لكل عضو
- إمكانية تحميل QR Code كصورة
- تصميم عصري وجذاب
- دعم اللغة العربية

## التثبيت

1. تثبيت المكتبات:
```bash
npm install
```

2. إعداد Firebase:
   - اذهب إلى [Firebase Console](https://console.firebase.google.com/)
   - أنشئ مشروع جديد
   - أضف تطبيق ويب
   - انسخ إعدادات Firebase
   - افتح ملف `src/firebase.js` واستبدل القيم بإعداداتك

3. تشغيل المشروع:
```bash
npm start
```

## البنية

- `/` - صفحة التسجيل
- `/profile/:id` - صفحة البروفايل

## البيانات المطلوبة

- الاسم (Name)
- البريد الإلكتروني (Email)
- رقم الهاتف (Number)
- رقم الهوية (ID)

## التقنيات المستخدمة

- React 18
- React Router v6
- Firebase Firestore
- CSS3
