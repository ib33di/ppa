# دليل نشر المشروع على Render

## الإعداد السريع

### 1. إنشاء Services في Render

#### Backend Service:
1. اذهب إلى [Render Dashboard](https://dashboard.render.com)
2. اضغط "New +" → "Web Service"
3. اختر "Connect GitHub" واختر المستودع `ib33di/ppa`
4. أو استخدم "New Blueprint" واختر ملف `render.yaml`

#### Frontend Service:
1. اضغط "New +" → "Static Site"
2. اختر "Connect GitHub" واختر المستودع `ib33di/ppa`
3. أو استخدم "New Blueprint" واختر ملف `render.yaml`

### 2. إضافة Environment Variables

#### Backend Environment Variables:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
ADWHATS_API_TOKEN=your_adwhats_api_token
ADWHATS_API_URL=https://api.adwhats.net
ADWHATS_ACCOUNT_ID=1
ADWHATS_WEBHOOK_TOKEN=your_webhook_token_here
PORT=3000
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
PAYMENT_PROVIDER_API_KEY=your_payment_provider_key (optional)
```

#### Frontend Environment Variables:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_API_BASE_URL=https://ppa-backend.onrender.com
```

**ملاحظة:** استبدل `https://ppa-backend.onrender.com` بـ URL الـ Backend الفعلي من Render بعد نشره.

### 3. ضبط Webhook في AdWhats

بعد نشر الـ Backend، ستحصل على URL مثل:
```
https://ppa-backend.onrender.com
```

#### إعداد Webhook:
1. اذهب إلى AdWhats Dashboard
2. ابحث عن قسم "Webhooks" أو "Settings"
3. أضف Webhook جديد:
   - **Webhook URL**: `https://ppa-backend.onrender.com/webhooks/whatsapp`
   - **Webhook Token**: (استخدم نفس القيمة من `ADWHATS_WEBHOOK_TOKEN`)

#### أو عبر API:
```bash
curl -X POST https://api.adwhats.net/webhooks/set \
  -H "token: YOUR_ADWHATS_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "whatsapp_account_id": 1,
    "url": "https://ppa-backend.onrender.com/webhooks/whatsapp",
    "webhook_token": "your_webhook_token_here"
  }'
```

### 4. تحديث Frontend Environment Variables

بعد الحصول على Backend URL:
1. اذهب إلى Frontend Service Settings في Render
2. في "Environment Variables"، حدّث:
   ```
   VITE_API_BASE_URL=https://ppa-backend.onrender.com
   ```
3. اضغط "Save Changes"
4. Render سيعيد بناء الـ Frontend تلقائياً

## الإعدادات الافتراضية من render.yaml

المشروع يحتوي على ملف `render.yaml` الذي يحدد الإعدادات التلقائية:

- **Backend**: 
  - Root Directory: `backend`
  - Build Command: `npm install && npm run build`
  - Start Command: `npm run start:prod`
  
- **Frontend**:
  - Root Directory: `frontend`
  - Build Command: `npm install && npm run build`
  - Publish Directory: `dist`

## التحقق من الإعداد

### اختبار Backend:
```bash
curl https://ppa-backend.onrender.com
```

### اختبار Webhook:
```bash
curl -X POST https://ppa-backend.onrender.com/webhooks/whatsapp \
  -H "Content-Type: application/json" \
  -H "webhook-token: your_webhook_token" \
  -d '{
    "whatsapp_account_id": 1,
    "from": "966512345678",
    "message": "YES"
  }'
```

### اختبار Frontend:
افتح `https://ppa-frontend.onrender.com` في المتصفح.

## ملاحظات مهمة

1. **Free Tier**: Services قد تدخل في "Sleep Mode" بعد 15 دقيقة من عدم الاستخدام
2. **Environment Variables**: لا تشارك الـ Tokens أو Secrets
3. **JWT_SECRET**: استخدم مفتاح قوي (32 حرف على الأقل)
4. **CORS**: إذا واجهت مشاكل CORS، تأكد من إضافة Frontend URL في CORS settings

## استكشاف الأخطاء

### Build فشل:
- تحقق من أن Root Directory مضبوط بشكل صحيح
- تحقق من أن جميع Environment Variables موجودة
- راجع Build Logs في Render Dashboard

### Webhook لا يعمل:
- تحقق من أن Webhook URL قابل للوصول
- تحقق من أن `webhook-token` header صحيح
- راجع Logs في Render Dashboard

### Frontend لا يتصل بالـ Backend:
- تحقق من `VITE_API_BASE_URL` في Environment Variables
- تأكد من أن Backend يعمل
- تحقق من CORS settings

