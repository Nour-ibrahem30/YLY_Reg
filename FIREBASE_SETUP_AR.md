# 🔥 إعداد Firebase لنظام التعرف على الوجه

## المتطلبات

يحتاج نظام Face Recognition إلى:
1. ✅ Firebase Firestore Database
2. ✅ Firebase Storage (اختياري للصور)
3. ✅ قواعد الأمان الصحيحة

## 📋 الخطوات

### 1. إنشاء Collections في Firestore

اذهب إلى Firebase Console → Firestore Database

#### Collection 1: adminFaces
```
Collection ID: adminFaces

Document Structure:
{
  name: string,           // اسم الأدمن
  descriptor: array,      // 128 رقم (بصمة الوجه)
  imageUrl: string,       // صورة base64
  registeredAt: string,   // تاريخ ISO
  active: boolean         // true/false
}
```

#### Collection 2: unauthorizedAccessAttempts
```
Collection ID: unauthorizedAccessAttempts

Document Structure:
{
  imageUrl: string,       // صورة base64
  timestamp: string,      // تاريخ ISO
  distance: number,       // 0-1
  userAgent: string,      // معلومات المتصفح
  ipAddress: string       // عنوان IP
}
```

### 2. إعداد قواعد الأمان

اذهب إلى Firestore Database → Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Admin Faces - للقراءة والكتابة
    match /adminFaces/{document=**} {
      allow read, write: if true;
    }
    
    // Unauthorized Attempts - للقراءة والكتابة
    match /unauthorizedAccessAttempts/{document=**} {
      allow read, write: if true;
    }
    
    // باقي المجموعات (إن وجدت)
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

⚠️ **ملاحظة**: هذه القواعد للتطوير فقط. في الإنتاج، يجب تأمينها أكثر.

### 3. التحقق من الإعداد

#### في Firebase Console:
1. اذهب إلى Firestore Database
2. تأكد من وجود Collections:
   - `adminFaces` (قد تكون فارغة)
   - `unauthorizedAccessAttempts` (قد تكون فارغة)

#### في التطبيق:
1. افتح Console في المتصفح (F12)
2. اذهب إلى `/admin/login`
3. ابحث عن:
   ```
   Found admin faces: 0
   Admin face registered: false
   ```

## 🔧 حل المشاكل الشائعة

### المشكلة 1: "Permission Denied"
**الحل**: تحقق من قواعد Firestore Rules

### المشكلة 2: "Collection not found"
**الحل**: Collections تُنشأ تلقائياً عند أول كتابة

### المشكلة 3: "Firebase not initialized"
**الحل**: تحقق من `src/firebase.js`

## 📝 التحقق من firebase.js

تأكد من أن الملف `src/firebase.js` يحتوي على:

```javascript
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
```

## 🧪 اختبار الاتصال

### في Console المتصفح:
```javascript
// Test Firebase connection
import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';

const testConnection = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'adminFaces'));
    console.log('✓ Firebase connected!');
    console.log('Documents:', snapshot.size);
  } catch (error) {
    console.error('✗ Firebase error:', error);
  }
};

testConnection();
```

## 📊 هيكل البيانات المتوقع

### بعد تسجيل أول أدمن:

```
Firestore Database
├── adminFaces
│   └── [document-id]
│       ├── name: "أحمد محمد"
│       ├── descriptor: [128 أرقام]
│       ├── imageUrl: "data:image/jpeg;base64,..."
│       ├── registeredAt: "2024-03-13T..."
│       └── active: true
└── unauthorizedAccessAttempts
    └── (فارغة في البداية)
```

### بعد محاولة دخول فاشلة:

```
Firestore Database
├── adminFaces
│   └── [document-id] (كما هو)
└── unauthorizedAccessAttempts
    └── [document-id]
        ├── imageUrl: "data:image/jpeg;base64,..."
        ├── timestamp: "2024-03-13T..."
        ├── distance: 0.85
        ├── userAgent: "Mozilla/5.0..."
        └── ipAddress: "192.168.1.1"
```

## ⚡ نصائح للأداء

### 1. تقليل حجم الصور
في `src/components/FaceRecognitionLogin.js`:
```javascript
const imageSrc = webcamRef.current.getScreenshot({
  width: 640,
  height: 480,
  quality: 0.8  // تقليل الجودة لتقليل الحجم
});
```

### 2. حذف المحاولات القديمة
يمكنك إضافة Cloud Function لحذف المحاولات الأقدم من 30 يوم.

### 3. استخدام Firebase Storage
بدلاً من حفظ الصور كـ base64 في Firestore، يمكن رفعها إلى Storage.

## 🔒 تأمين الإنتاج

### قواعد أمان محسّنة:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Admin Faces - قراءة فقط من التطبيق
    match /adminFaces/{document=**} {
      allow read: if true;
      allow write: if request.auth != null; // يتطلب مصادقة
    }
    
    // Unauthorized Attempts - كتابة فقط
    match /unauthorizedAccessAttempts/{document=**} {
      allow read: if request.auth != null; // يتطلب مصادقة
      allow write: if true; // للسماح بتسجيل المحاولات
    }
  }
}
```

## ✅ Checklist النهائي

- [ ] Firebase project مُنشأ
- [ ] Firestore Database مُفعّل
- [ ] قواعد الأمان مُعدّة
- [ ] `src/firebase.js` يحتوي على المفاتيح الصحيحة
- [ ] التطبيق يتصل بـ Firebase بنجاح
- [ ] Console لا يظهر أخطاء Firebase

---

**جاهز للاستخدام!** 🚀
