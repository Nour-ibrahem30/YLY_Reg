# Face Recognition Models

هذا المجلد يحتوي على نماذج التعرف على الوجه المطلوبة لنظام Face Recognition.

## تحميل النماذج

يجب تحميل النماذج التالية من مكتبة face-api.js ووضعها في هذا المجلد:

### النماذج المطلوبة:

1. **tiny_face_detector_model-weights_manifest.json**
2. **tiny_face_detector_model-shard1**
3. **face_landmark_68_model-weights_manifest.json**
4. **face_landmark_68_model-shard1**
5. **face_recognition_model-weights_manifest.json**
6. **face_recognition_model-shard1**
7. **face_recognition_model-shard2**
8. **face_expression_model-weights_manifest.json**
9. **face_expression_model-shard1**

### طريقة التحميل:

يمكنك تحميل النماذج من:
https://github.com/vladmandic/face-api/tree/master/model

أو استخدام الأمر التالي لتحميلها تلقائياً:

```bash
# Clone the repository temporarily
git clone https://github.com/vladmandic/face-api.git temp-face-api

# Copy models to public folder
cp -r temp-face-api/model/* public/models/

# Remove temporary folder
rm -rf temp-face-api
```

### ملاحظات:

- النماذج ضرورية لعمل نظام التعرف على الوجه
- حجم النماذج حوالي 5-10 MB
- يتم تحميل النماذج مرة واحدة عند بدء التطبيق
- النماذج يتم تخزينها في cache المتصفح لتحسين الأداء

## البدائل

إذا كنت تريد استخدام CDN بدلاً من تحميل النماذج محلياً، يمكنك تعديل `src/services/faceRecognitionService.js`:

```javascript
const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';
```

لكن يُفضل تحميل النماذج محلياً لضمان الأداء والاستقرار.
