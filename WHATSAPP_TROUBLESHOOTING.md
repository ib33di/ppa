# WhatsApp Invitation Troubleshooting Guide

## Common Issues and Solutions

### 1. Messages Not Sending

#### Check API Token Configuration
```bash
# In backend/.env file, ensure:
ADWHATS_API_TOKEN=your_token_here
ADWHATS_API_URL=https://api.adwhats.net
ADWHATS_ACCOUNT_ID=1
```

**Symptoms:**
- No error messages in console
- Invitations created but no WhatsApp messages sent
- Backend logs show "API token is not configured"

**Solution:**
1. Verify `ADWHATS_API_TOKEN` is set in backend `.env` file
2. Restart backend server after adding token
3. Check backend logs for token validation errors

#### Check API Response
**Symptoms:**
- Backend logs show API errors
- Status code 401 (Unauthorized)
- Status code 400 (Bad Request)

**Solution:**
1. Verify token is valid and not expired
2. Check AdWhats dashboard for account status
3. Verify `ADWHATS_ACCOUNT_ID` matches your account ID
4. Check backend logs for detailed error messages

### 2. Phone Number Format Issues

**Symptoms:**
- "Invalid phone number" errors
- Messages sent to wrong numbers

**Solution:**
- Phone numbers are automatically normalized (removes `+` and spaces)
- Ensure phone numbers in database are stored correctly
- Format: `966512345678` (country code + number, no spaces)

### 3. Invitation Status Not Updating

**Symptoms:**
- Messages sent but invitation status stays "pending"
- Status should change to "invited" after sending

**Solution:**
1. Check backend logs for database update errors
2. Verify database connection is working
3. Check RLS policies allow updates to invitations table

### 4. Frontend Errors

**Symptoms:**
- "Failed to send invitation" alerts
- Network errors in browser console

**Solution:**
1. Check browser console for detailed error messages
2. Verify backend is running and accessible
3. Check CORS configuration in backend
4. Verify authentication token is valid

## Debugging Steps

### 1. Check Backend Logs
```bash
# Backend logs will show:
[WhatsApp] Sending invitation for invitationId: xxx
[WhatsApp] Sending to player: Player Name (phone)
[WhatsApp] API Response Status: 200
[WhatsApp] Message sent successfully
```

### 2. Test API Directly
```bash
curl -X POST http://localhost:3000/whatsapp/send-invitation \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"invitationId": "invitation-uuid"}'
```

### 3. Verify AdWhats Account
```bash
# Check if account is ready
curl -X GET https://api.adwhats.net/accounts \
  -H "token: YOUR_ADWHATS_TOKEN"
```

### 4. Check Database
```sql
-- Verify invitation exists
SELECT * FROM invitations WHERE id = 'invitation-id';

-- Check player phone number
SELECT id, name, phone FROM players WHERE id = 'player-id';

-- Check match details
SELECT * FROM matches WHERE id = 'match-id';
```

## Error Messages Reference

| Error Message | Cause | Solution |
|--------------|-------|----------|
| "WhatsApp API token is not configured" | Missing `ADWHATS_API_TOKEN` | Add token to `.env` file |
| "AdWhats API error (401)" | Invalid or expired token | Update token in `.env` |
| "AdWhats API error (400)" | Invalid request format | Check phone number format |
| "Invitation not found" | Invalid invitation ID | Verify invitation exists |
| "Player not found" | Invalid player ID | Verify player exists |
| "Match not found" | Invalid match ID | Verify match exists |

## Testing Checklist

- [ ] Backend `.env` has `ADWHATS_API_TOKEN` set
- [ ] Backend server is running
- [ ] AdWhats account is active and ready
- [ ] Phone numbers are in correct format
- [ ] Player has valid phone number
- [ ] Match exists and is valid
- [ ] Invitation exists in database
- [ ] Backend logs show no errors
- [ ] Frontend shows success message

## Getting Help

If issues persist:
1. Check backend logs for detailed error messages
2. Verify all environment variables are set correctly
3. Test API endpoints directly with curl
4. Check AdWhats dashboard for account status
5. Verify database records exist and are valid

