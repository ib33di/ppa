# Ultramsg.com API Integration Guide

This document describes how the application integrates with Ultramsg.com WhatsApp API.

## Overview

The application uses Ultramsg.com to send and receive WhatsApp messages for match invitations.

## Configuration

### Environment Variables

Required environment variables in `backend/.env`:

```env
# Ultramsg.com API Configuration
ULTRAMSG_TOKEN=your_ultramsg_token
ULTRAMSG_API_URL=https://api.ultramsg.com/instance157813
# أو
# ULTRAMSG_API_URL=https://api.ultramsg.com/instance157813/
ULTRAMSG_WEBHOOK_TOKEN=your_webhook_token_for_verification
```

**ملاحظة:** يجب أن يحتوي `ULTRAMSG_API_URL` على Instance ID في المسار. استبدل `instance157813` بـ Instance ID الخاص بك.

### Getting Credentials

1. Sign up at [ultramsg.com](https://ultramsg.com)
2. Create a new Instance
3. Get your credentials:
   - **Instance ID**: Found in Instance settings (e.g., `instance157813`)
   - **Token**: Found in Instance > API settings
4. Set `ULTRAMSG_API_URL` to: `https://api.ultramsg.com/{your_instance_id}`

## API Endpoints Used

### 1. Check Instance Status

**Endpoint:**
```
GET {ULTRAMSG_API_URL}/instance/status?token={token}
```

**مثال:**
```
GET https://api.ultramsg.com/instance157813/instance/status?token=your_token
```

**Response:**
```json
{
  "status": "connected",
  "connected": true
}
```

### 2. Send Message

**Endpoint:**
```
POST {ULTRAMSG_API_URL}/messages/chat?token={token}&to={phone}&body={message}
```

**Parameters:**
- `ULTRAMSG_API_URL`: Your Ultramsg API URL with instance ID (e.g., `https://api.ultramsg.com/instance157813`)
- `token`: Your Ultramsg API token
- `to`: Phone number (without +, e.g., `966512345678`)
- `body`: Message text (URL encoded)

**Example:**
```bash
curl -X POST "https://api.ultramsg.com/instance157813/messages/chat?token=YOUR_TOKEN&to=966512345678&body=Hello%20World"
```

**Response:**
```json
{
  "sent": true,
  "id": "message_id_here"
}
```

### 3. Setup Webhook (via Dashboard)

Ultramsg webhook setup is typically done via dashboard:

1. Go to Instance Settings > Webhook
2. Enable "Webhook on Received"
3. Set webhook URL: `https://your-domain.com/webhooks/whatsapp`

**Note:** Some Ultramsg instances may support API-based webhook setup:
```
POST {ULTRAMSG_API_URL}/instance/webhook?token={token}&webhook={url}
```

**مثال:**
```
POST https://api.ultramsg.com/instance157813/instance/webhook?token=YOUR_TOKEN&webhook=https://your-domain.com/webhooks/whatsapp
```

## Webhook Payload Format

When a message is received, Ultramsg sends a POST request to your webhook URL with:

```json
{
  "instance": "your_instance_id",
  "from": "966512345678",
  "body": "YES",
  "type": "chat"
}
```

Or alternative format:

```json
{
  "data": {
    "from": "966512345678",
    "body": "YES"
  }
}
```

## Phone Number Format

- **Sending**: Phone numbers should be **without** `+` prefix (e.g., `966512345678`)
- **Receiving**: Ultramsg sends phone numbers **without** `+` prefix
- The application automatically normalizes phone numbers to handle both formats

## Implementation Details

### Sending Messages

The `WhatsAppService.sendInvitation()` method:
1. Verifies instance status
2. Formats the invitation message
3. Sends via Ultramsg API
4. Updates invitation status in database

### Receiving Messages

The `WebhooksService.handleWhatsAppWebhook()` method:
1. Extracts message from payload (`body` field)
2. Extracts phone number (`from` field)
3. Processes YES/NO detection
4. Updates invitation status

## Error Handling

### Common Errors

| Error | Cause | Solution |
|------|-------|----------|
| "Instance is not connected" | Instance not authenticated | Scan QR code in Ultramsg dashboard |
| "Invalid token" | Wrong token | Check `ULTRAMSG_TOKEN` in `.env` |
| "Instance ID not found" | Wrong instance ID | Check `ULTRAMSG_INSTANCE_ID` in `.env` |
| "Message not sent" | API error | Check Ultramsg dashboard for details |

### Response Format

Success:
```json
{
  "sent": true,
  "id": "message_id"
}
```

Error:
```json
{
  "sent": false,
  "error": "Error message"
}
```

## Testing

### 1. Test Instance Status

```bash
curl "https://api.ultramsg.com/instance157813/instance/status?token=YOUR_TOKEN"
```

### 2. Test Sending Message

```bash
curl -X POST "https://api.ultramsg.com/instance157813/messages/chat?token=YOUR_TOKEN&to=966512345678&body=Test%20Message"
```

**ملاحظة:** استبدل `instance157813` بـ Instance ID الخاص بك.

### 3. Test Webhook

Send a message from WhatsApp to your Ultramsg number, then check backend logs for:
```
[Webhook] ========== WEBHOOK RECEIVED ==========
[WhatsApp] Processing incoming message
```

## Notes

1. **Instance Status**: Always verify instance is connected before sending messages
2. **Rate Limits**: Check your Ultramsg plan for rate limits
3. **Webhook Security**: Use `ULTRAMSG_WEBHOOK_TOKEN` for webhook verification if needed
4. **Phone Format**: Always use numbers without `+` prefix when sending to Ultramsg API

