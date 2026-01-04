# إعداد Webhook في AdWhats

## الرابط الحالي للـ Backend:
```
https://ppa-backend-tfjj.onrender.com
```

## Webhook URL:
```
https://ppa-backend-tfjj.onrender.com/webhooks/whatsapp
```

## الطريقة 1: عبر Backend Endpoint (موصى به)

### استخدم endpoint التالي لإعداد webhook تلقائياً:

```bash
curl -X POST https://ppa-backend-tfjj.onrender.com/whatsapp/setup-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "webhookUrl": "https://ppa-backend-tfjj.onrender.com/webhooks/whatsapp",
    "webhookToken": "your_webhook_token_here"
  }'
```

**ملاحظة:** إذا لم تحدد `webhookToken`، سيستخدم النظام القيمة من `ADWHATS_WEBHOOK_TOKEN` في environment variables.

## الطريقة 2: مباشرة عبر AdWhats API

### أ) باستخدام PowerShell (Windows):

```powershell
# الطريقة 1: استخدام السكريبت
.\setup-webhook.ps1 -ApiToken "YOUR_ADWHATS_API_TOKEN"

# الطريقة 2: مباشرة
$apiToken = "YOUR_ADWHATS_API_TOKEN"
$body = @{
    whatsapp_account_id = 8249
    url = "https://ppa-backend-tfjj.onrender.com/webhooks/whatsapp"
    webhook_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkZXZfdG9rZW4iOiJlNGFiNGNlNS1kNTRiLTQxNDUtOTA2ZC1kNzZhYzc1NGY3MDgiLCJpYXQiOjE3Njc0ODA4MjksImV4cCI6MTc5OTAxNjgyOX0.USibzSRHChv2KhoFMmZscxhnECmKz-38aiBhYjssqyI"
} | ConvertTo-Json

$headers = @{
    "token" = $apiToken
    "Content-Type" = "application/json"
}

Invoke-RestMethod -Uri "https://api.adwhats.net/webhooks/set" -Method Post -Headers $headers -Body $body
```

### ب) باستخدام curl (Linux/Mac/Git Bash):

```bash
curl -X POST https://api.adwhats.net/webhooks/set \
  -H "token: YOUR_ADWHATS_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "whatsapp_account_id": 8249,
    "url": "https://ppa-backend-tfjj.onrender.com/webhooks/whatsapp",
    "webhook_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkZXZfdG9rZW4iOiJlNGFiNGNlNS1kNTRiLTQxNDUtOTA2ZC1kNzZhYzc1NGY3MDgiLCJpYXQiOjE3Njc0ODA4MjksImV4cCI6MTc5OTAxNjgyOX0.USibzSRHChv2KhoFMmZscxhnECmKz-38aiBhYjssqyI"
  }'
```

**استبدل:**
- `YOUR_ADWHATS_API_TOKEN`: الـ token من AdWhats (من صفحة المطورين)
- `8249`: Account ID الخاص بك (تحقق من القيمة الصحيحة من `/accounts` endpoint)

## التحقق من أن Webhook يعمل:

### 1. تحقق من أن endpoint يعمل:
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

### 2. اختبر webhook:
- أرسل رسالة "YES" من WhatsApp إلى رقم AdWhats
- تحقق من logs الـ backend في Render Dashboard
- يجب أن ترى:
  - `[Webhook] ========== WEBHOOK RECEIVED ==========`
  - `[WhatsApp] Processing incoming message`
  - `[WhatsApp] Matched YES keyword: "YES"`
  - `[WhatsApp] Found player`
  - `[WhatsApp] Updating invitation`

## استكشاف الأخطاء:

### إذا لم يصل webhook:
1. تحقق من أن webhook URL صحيح
2. تحقق من أن الـ backend يعمل (https://ppa-backend-tfjj.onrender.com)
3. تحقق من أن `ADWHATS_WEBHOOK_TOKEN` في Render environment variables يطابق `webhook_token` في AdWhats
4. تحقق من logs في Render Dashboard

### إذا وصل webhook لكن لا يعمل:
1. تحقق من logs الـ backend:
   - `player_not_found`: رقم الهاتف في قاعدة البيانات لا يطابق الرقم المرسل
   - `no_pending_invitation`: لا توجد دعوة pending للاعب
   - `unknown`: الرسالة ليست YES أو NO

