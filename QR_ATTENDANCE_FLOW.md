# تدفق تسجيل الحضور عبر QR Code

## ✅ كيف يعمل النظام

### 1. المستخدم يفتح البروفايل
- URL: `/profile/:governorate/:id`
- `id` = Document ID في `users` collection
- يظهر QR Code يحتوي على: `${window.location.origin}/profile/${governorate}/${id}`

### 2. الأدمن يفتح صفحة الـ QR Scanner
- URL: `/admin/scanner`
- يختار الفعالية النشطة
- يضغط "بدء المسح"

### 3. عند مسح QR Code
```javascript
// 1. استخراج معلومات المستخدم من QR
const userInfo = extractUserInfo(decodedText);
// userInfo.userId = Document ID

// 2. جلب بيانات المستخدم من users collection
const userDoc = await getDoc(doc(db, 'users', userInfo.userId));
const userData = userDoc.data();

// 3. تسجيل الحضور
await recordAttendance(
  userInfo.userId,  // Document ID
  selectedEventId,  // Event ID
  'admin',
  userData
);

// 4. إضافة نقاط الحضور (10 نقاط)
await addAttendancePoints(userInfo.userId, userData);
```

### 4. تسجيل الحضور في Firebase
يتم الحفظ في `attendance` collection:
```javascript
{
  userId: "document_id",           // Document ID من users
  eventId: "event_id",             // Event ID
  scannedBy: "admin",
  userName: "اسم المستخدم",
  userEmail: "email@example.com",
  userGovernorate: "القاهرة",
  userCommittee: "HR",
  userRole: "Member",
  timestamp: "2026-03-05T...",
  createdAt: Timestamp
}
```

### 5. عرض الحضور في البروفايل
```javascript
// في UserEvents component
<UserEvents userId={id} />  // id = Document ID

// داخل UserEvents
const attendanceResult = await getAttendanceByUser(userId);
// يجلب جميع سجلات الحضور للمستخدم

// التحقق من الحضور
const hasAttended = (eventId) => {
  return userAttendance.some(att => att.eventId === eventId);
};
```

### 6. عرض الحضور في صفحة الأدمن
- URL: `/admin/attendance`
- يعرض جميع سجلات الحضور
- يمكن الفلترة حسب الفعالية، المحافظة، اللجنة

---

## 🔍 التحقق من عمل النظام

### الخطوة 1: إنشاء فعالية
1. افتح `/admin/events`
2. اضغط "إضافة فعالية جديدة"
3. املأ البيانات وتأكد أن الحالة "نشطة"
4. احفظ

### الخطوة 2: فتح البروفايل
1. افتح `/profile/:governorate/:id`
2. تأكد من ظهور QR Code
3. تأكد من ظهور الفعالية في قسم "الفعاليات المتاحة"
4. يجب أن تكون بدون علامة "حضرت"

### الخطوة 3: مسح QR Code
1. افتح `/admin/scanner`
2. اختر الفعالية
3. اضغط "بدء المسح"
4. امسح QR Code من البروفايل
5. يجب أن تظهر رسالة "تم تسجيل الحضور بنجاح!"

### الخطوة 4: التحقق من التسجيل
1. ارجع للبروفايل `/profile/:governorate/:id`
2. يجب أن تظهر علامة "حضرت" ✓ على الفعالية
3. افتح `/admin/attendance`
4. يجب أن يظهر سجل الحضور

---

## 🐛 استكشاف الأخطاء

### المشكلة: "المستخدم غير موجود أو غير معتمد"
**السبب**: المستخدم موجود في governorate collection لكن مش في `users`
**الحل**: 
1. افتح `/admin/pending`
2. اقبل طلب التسجيل
3. أو انقل المستخدم يدوياً من governorate إلى `users`

### المشكلة: "لا توجد فعاليات نشطة"
**السبب**: مفيش فعاليات بحالة "active"
**الحل**:
1. افتح `/admin/events`
2. تأكد من وجود فعالية
3. تأكد أن حالتها "نشطة" (أخضر)

### المشكلة: الحضور لا يظهر في البروفايل
**السبب**: مشكلة في `userId`
**الحل**:
1. افتح Browser Console (F12)
2. ابحث عن أخطاء
3. تأكد من أن `userId` في attendance يطابق document ID

### المشكلة: Firebase Permission Denied
**السبب**: Firebase Rules غير صحيحة
**الحل**: راجع `FIREBASE_RULES_SETUP.md`

---

## 📊 البيانات المخزنة

### في `users` collection:
```
users/
  └── {documentId}/
      ├── name
      ├── email
      ├── userId (14 رقم)
      ├── governorate
      ├── committee
      ├── role
      └── ...
```

### في `attendance` collection:
```
attendance/
  └── {attendanceId}/
      ├── userId (document ID)
      ├── eventId
      ├── userName
      ├── userEmail
      ├── userGovernorate
      ├── userCommittee
      ├── userRole
      ├── timestamp
      └── createdAt
```

### في `events` collection:
```
events/
  └── {eventId}/
      ├── name
      ├── description
      ├── date
      ├── location
      ├── status (active/closed)
      ├── createdAt
      └── updatedAt
```

---

## ✅ الخلاصة

النظام يعمل بالشكل التالي:
1. ✅ QR Code يحتوي على Document ID
2. ✅ Scanner يستخرج Document ID من QR
3. ✅ يسجل الحضور في `attendance` collection
4. ✅ UserEvents يجلب الحضور باستخدام Document ID
5. ✅ يعرض علامة "حضرت" على الفعاليات المسجلة

**كل شيء متصل بشكل صحيح!** 🎉
