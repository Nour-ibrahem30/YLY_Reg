# إعداد Firebase Rules لإضافة الفعاليات

## المشكلة
لا يمكن إضافة فعاليات جديدة بسبب صلاحيات Firebase.

## الحل

### 1. افتح Firebase Console
اذهب إلى: https://console.firebase.google.com/

### 2. اختر مشروعك
اختر مشروع `yly-cairo`

### 3. افتح Firestore Database
من القائمة الجانبية → Firestore Database

### 4. اضغط على "Rules" (القواعد)
في الأعلى، اضغط على تبويب "Rules"

### 5. استبدل القواعد الحالية بهذه:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // قواعد المحافظات (للمستخدمين القدامى)
    match /{governorate}/{userId} {
      allow read: if true;
      allow write: if true;
    }
    
    // قواعد users collection (المستخدمين المعتمدين)
    match /users/{userId} {
      allow read: if true;
      allow write: if true;
    }
    
    // قواعد pending_registrations (طلبات التسجيل المعلقة)
    match /pending_registrations/{registrationId} {
      allow read: if true;
      allow write: if true;
    }
    
    // قواعد events (الفعاليات) - مهم جداً!
    match /events/{eventId} {
      allow read: if true;
      allow create: if true;
      allow update: if true;
      allow delete: if true;
    }
    
    // قواعد attendance (الحضور)
    match /attendance/{attendanceId} {
      allow read: if true;
      allow write: if true;
    }
    
    // قواعد tasks (المهام)
    match /tasks/{taskId} {
      allow read: if true;
      allow write: if true;
    }
    
    // قواعد points (النقاط)
    match /points/{pointId} {
      allow read: if true;
      allow write: if true;
    }
  }
}
```

### 6. اضغط "Publish" (نشر)

---

## ملاحظة أمنية ⚠️

هذه القواعد مفتوحة للجميع (`allow read/write: if true`) وهي مناسبة للتطوير والاختبار فقط.

### للإنتاج، استخدم قواعد أكثر أماناً:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // دالة للتحقق من أن المستخدم أدمن
    function isAdmin() {
      return request.auth != null && 
             get(/databases/$(database)/documents/admins/$(request.auth.uid)).data.role == 'admin';
    }
    
    // قواعد users - القراءة للجميع، الكتابة للأدمن فقط
    match /users/{userId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    // قواعد pending_registrations
    match /pending_registrations/{registrationId} {
      allow read: if isAdmin();
      allow create: if true; // السماح للجميع بالتسجيل
      allow update, delete: if isAdmin();
    }
    
    // قواعد events - القراءة للجميع، الكتابة للأدمن فقط
    match /events/{eventId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    // قواعد attendance
    match /attendance/{attendanceId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    // قواعد tasks
    match /tasks/{taskId} {
      allow read: if request.auth != null;
      allow write: if isAdmin();
    }
    
    // قواعد points
    match /points/{pointId} {
      allow read: if request.auth != null;
      allow write: if isAdmin();
    }
  }
}
```

---

## اختبار بعد التحديث

1. افتح الموقع
2. اذهب إلى `/admin/events`
3. اضغط "إضافة فعالية جديدة"
4. املأ البيانات
5. اضغط "إضافة"
6. يجب أن تضاف الفعالية بنجاح! ✅

---

## إذا استمرت المشكلة

افتح Browser Console (F12) وابحث عن رسائل الخطأ. إذا رأيت:
- `permission-denied` → المشكلة في Firebase Rules
- `network error` → تحقق من اتصال الإنترنت
- أي خطأ آخر → أرسل لي رسالة الخطأ كاملة

---

**تم إنشاء هذا الملف**: 5 مارس 2026
