# إعداد Webhook في Ultramsg.com

## الرابط الحالي للـ Backend:
```
https://ppa-backend-tfjj.onrender.com
```

## Webhook URL:
```
https://ppa-backend-tfjj.onrender.com/webhooks/whatsapp
```

## إعداد Ultramsg.com

### 1. إنشاء حساب في Ultramsg.com
1. سجل في [ultramsg.com](https://ultramsg.com)
2. أنشئ Instance جديد
3. احصل على:
   - **Instance ID**: من صفحة Instance
   - **Token**: من صفحة Instance > API

### 2. إعداد متغيرات البيئة (Environment Variables)

في ملف `.env` أو في Render Dashboard، أضف:

```env
ULTRAMSG_TOKEN=your_ultramsg_token
ULTRAMSG_API_URL=https://api.ultramsg.com/instance157813
# أو
# ULTRAMSG_API_URL=https://api.ultramsg.com/instance157813/
ULTRAMSG_WEBHOOK_TOKEN=your_webhook_token_for_verification
```

**ملاحظة:** يجب أن يحتوي `ULTRAMSG_API_URL` على Instance ID في المسار. يمكنك استخدام أي من الصيغتين:
- `https://api.ultramsg.com/instance157813` (بدون شرطة مائلة)
- `https://api.ultramsg.com/instance157813/` (مع شرطة مائلة)

استبدل `instance157813` بـ Instance ID الخاص بك.

### 3. إعداد Webhook في Ultramsg Dashboard

#### الطريقة الموصى بها: عبر Dashboard

1. اذهب إلى [Ultramsg Dashboard](https://ultramsg.com)
2. اختر Instance الخاص بك
3. اذهب إلى **Settings** > **Webhook**
4. فعّل **"Webhook on Received"**
5. أدخل Webhook URL:
   ```
   https://ppa-backend-tfjj.onrender.com/webhooks/whatsapp
   ```
6. احفظ الإعدادات

#### الطريقة البديلة: عبر API (إن أمكن)

```bash
curl -X POST "https://api.ultramsg.com/YOUR_INSTANCE_ID/instance/webhook?token=YOUR_TOKEN&webhook=https://ppa-backend-tfjj.onrender.com/webhooks/whatsapp"
```

**استبدل:**
- `YOUR_INSTANCE_ID`: Instance ID من Ultramsg
- `YOUR_TOKEN`: Token من Ultramsg

### 4. التحقق من أن Webhook يعمل

#### أ) تحقق من أن endpoint يعمل:
```bash
curl https://ppa-backend-tfjj.onrender.com/webhooks/whatsapp
```

يجب أن ترى:
```json
{
  "success": true,
  "message": "Webhook endpoint is active",
  "timestamp": "..."
}
```

#### ب) اختبر webhook:
1. أرسل رسالة "YES" أو "نعم" من WhatsApp إلى رقم Ultramsg
2. تحقق من logs الـ backend في Render Dashboard
3. يجب أن ترى:
   - `[Webhook] ========== WEBHOOK RECEIVED ==========`
   - `[WhatsApp] Processing incoming message`
   - `[WhatsApp] Matched YES keyword: "YES"`
   - `[WhatsApp] Found player`
   - `[WhatsApp] Updating invitation`

## تنسيق Payload من Ultramsg

Ultramsg يرسل webhook payload بالشكل التالي:

```json
{
  "instance": "your_instance_id",
  "from": "966512345678",
  "body": "YES",
  "type": "chat"
}
```

أو:

```json
{
  "data": {
    "from": "966512345678",
    "body": "YES"
  }
}
```

## استكشاف الأخطاء

### إذا لم يصل webhook:
1. ✅ تحقق من أن webhook URL صحيح في Ultramsg Dashboard
2. ✅ تحقق من أن الـ backend يعمل (https://ppa-backend-tfjj.onrender.com)
3. ✅ تحقق من أن `ULTRAMSG_WEBHOOK_TOKEN` في Render environment variables (إن كان مطلوباً)
4. ✅ تحقق من logs في Render Dashboard
5. ✅ تأكد من أن Instance متصل (Status: Connected)

### إذا وصل webhook لكن لا يعمل:
1. تحقق من logs الـ backend:
   - `player_not_found`: رقم الهاتف في قاعدة البيانات لا يطابق الرقم المرسل
   - `no_pending_invitation`: لا توجد دعوة pending للاعب
   - `unknown`: الرسالة ليست YES أو NO
   - `invalid_message`: الرسالة فارغة أو undefined

2. تحقق من تنسيق رقم الهاتف:
   - يجب أن يكون الرقم بصيغة: `966512345678` (بدون +)
   - أو `+966512345678` (مع +)
   - النظام يتعامل مع كلا الصيغتين

### إذا كانت الرسالة تصل كـ "undefined":
- تحقق من logs في `[Webhook] Message field analysis`
- قد يكون الحقل باسم مختلف في payload
- الكود يبحث تلقائياً في: `body`, `message`, `text`, `content`

## إرسال رسائل عبر Ultramsg API

### مثال لإرسال رسالة يدوياً:

```bash
curl -X POST "https://api.ultramsg.com/YOUR_INSTANCE_ID/messages/chat?token=YOUR_TOKEN&to=966512345678&body=Hello%20World"
```

**استبدل:**
- `YOUR_INSTANCE_ID`: Instance ID
- `YOUR_TOKEN`: Token
- `966512345678`: رقم الهاتف (بدون +)
- `Hello%20World`: نص الرسالة (URL encoded)

## ملاحظات مهمة

1. **Instance Status**: تأكد من أن Instance متصل قبل إرسال الرسائل
2. **Phone Format**: Ultramsg يتطلب رقم الهاتف بدون + (مثال: `966512345678`)
3. **Webhook Security**: يمكنك إضافة token verification في `ULTRAMSG_WEBHOOK_TOKEN`
4. **Rate Limits**: تحقق من حدود الإرسال في خطة Ultramsg الخاصة بك
