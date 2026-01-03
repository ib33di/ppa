# AdWhats API Integration Guide

This document describes how the application integrates with AdWhats WhatsApp API.

## API Configuration

Based on the AdWhats API documentation found in `demo/apiwhats/intro.html`:

### Base URL
```
https://api.adwhats.net
```

### Authentication
- **Header**: `token` (not `Authorization: Bearer`)
- **Value**: Your AdWhats API token (JWT)

### WhatsApp Account ID
- Required for sending messages
- Default: `1` (can be configured via `ADWHATS_ACCOUNT_ID` env variable)
- Get available accounts via `GET /accounts` endpoint

## API Endpoints Used

### 1. Get WhatsApp Accounts
```
GET https://api.adwhats.net/accounts
Headers:
  token: your_api_token
```

Response:
```json
{
  "status": "success",
  "data": {
    "records": [
      {
        "id": 1,
        "label": "label",
        "mobile": "966512345678",
        "ready": true
      }
    ]
  }
}
```

### 2. Send Message
```
POST https://api.adwhats.net/messages/send
Headers:
  token: your_api_token
  Content-Type: application/json
Body:
{
  "whatsapp_account_id": 1,
  "to": "966512345678",
  "message": "Your message here"
}
```

Response:
```json
{
  "status": "success"
}
```

### 3. Set Webhook
```
POST https://api.adwhats.net/webhooks/set
Headers:
  token: your_api_token
  Content-Type: application/json
Body:
{
  "whatsapp_account_id": 1,
  "url": "https://your-domain.com/webhooks/whatsapp",
  "webhook_token": "your_webhook_token"
}
```

## Webhook Configuration

### Incoming Webhook Payload
When a message is received, AdWhats sends:

```
POST https://your-domain.com/webhooks/whatsapp
Headers:
  webhook-token: your_webhook_token
Body:
{
  "whatsapp_account_id": 1,
  "from": "966512345678",
  "message": "YES"
}
```

### Phone Number Format
- AdWhats sends phone numbers **without** `+` prefix
- Format: `966512345678` (country code + number, no spaces)
- The application normalizes phone numbers automatically

### Message Detection
The system detects:
- **YES**: `YES`, `Y`, `SI`, `OK`, `CONFIRM`, `ACCEPT`, `نعم`, `موافق`, `أوافق`, `موافقة`
- **NO**: `NO`, `N`, `DECLINE`, `REJECT`, `CANCEL`, `لا`, `رفض`, `غير موافق`

## Environment Variables

```env
# AdWhats API Token (JWT)
ADWHATS_API_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# API Base URL
ADWHATS_API_URL=https://api.adwhats.net

# WhatsApp Account ID (usually 1)
ADWHATS_ACCOUNT_ID=1

# Webhook Token (for verification)
ADWHATS_WEBHOOK_TOKEN=your_webhook_token
```

## Implementation Notes

1. **Phone Number Normalization**: The system automatically removes `+` and spaces from phone numbers before sending to AdWhats API.

2. **Error Handling**: AdWhats returns `{ status: "error", message: "..." }` on errors. The application checks for `status === "success"`.

3. **Webhook Security**: The webhook endpoint verifies the `webhook-token` header if `ADWHATS_WEBHOOK_TOKEN` is set.

4. **Account Verification**: Use `getAccounts()` method to verify your WhatsApp account ID before sending messages.

## Testing

### Test Send Message
```bash
curl -X POST http://localhost:3000/whatsapp/send-invitation \
  -H "Content-Type: application/json" \
  -d '{"invitationId": "invitation-uuid"}'
```

### Test Webhook
```bash
curl -X POST http://localhost:3000/webhooks/whatsapp \
  -H "Content-Type: application/json" \
  -H "webhook-token: your_webhook_token" \
  -d '{
    "whatsapp_account_id": 1,
    "from": "966512345678",
    "message": "YES"
  }'
```

## Troubleshooting

1. **"Invalid token"**: Check that `ADWHATS_API_TOKEN` is set correctly
2. **"Account not found"**: Verify `ADWHATS_ACCOUNT_ID` matches your account ID
3. **"Webhook not receiving"**: 
   - Check webhook URL is accessible (use ngrok for local dev)
   - Verify `webhook-token` header matches `ADWHATS_WEBHOOK_TOKEN`
4. **"Phone number format error"**: Ensure phone numbers are stored without `+` prefix or the system will normalize them

