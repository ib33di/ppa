# Detailed Setup Guide

## Quick Start Checklist

- [ ] Supabase project created and schema.sql executed
- [ ] Backend .env configured with Supabase credentials
- [ ] Backend dependencies installed (`npm install` in backend/)
- [ ] Backend running (`npm run start:dev`)
- [ ] Frontend .env configured with Supabase anon key
- [ ] Frontend dependencies installed (`npm install` in frontend/)
- [ ] Frontend running (`npm run dev`)
- [ ] Ultramsg.com account created and Instance ID obtained
- [ ] Ultramsg token obtained
- [ ] Ultramsg webhook configured (use ngrok for local dev)

## Step-by-Step Setup

### 1. Supabase Database Setup

1. Go to https://supabase.com and create a new project
2. Wait for project to initialize (takes ~2 minutes)
3. Go to SQL Editor
4. Copy and paste the entire contents of `supabase/schema.sql`
5. Click "Run" to execute the schema
6. Verify tables were created: Go to Table Editor, you should see:
   - courts
   - players
   - matches
   - invitations
   - payments

### 2. Get Supabase Credentials

1. Go to Settings > API
2. Copy:
   - Project URL (for SUPABASE_URL)
   - `service_role` key (for SUPABASE_SERVICE_ROLE_KEY - backend only!)
   - `anon` key (for VITE_SUPABASE_ANON_KEY - frontend only!)

### 3. Backend Setup

```bash
cd backend
npm install

# Create .env file
cat > .env << EOF
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
ULTRAMSG_TOKEN=your_ultramsg_token_here
ULTRAMSG_INSTANCE_ID=your_ultramsg_instance_id_here
ULTRAMSG_API_URL=https://api.ultramsg.com
ULTRAMSG_WEBHOOK_TOKEN=your_webhook_token_here
PORT=3000
NODE_ENV=development
EOF

# Start server
npm run start:dev
```

Verify backend is running:
```bash
curl http://localhost:3000/players
# Should return [] (empty array)
```

### 4. Frontend Setup

```bash
cd frontend
npm install

# Create .env file
cat > .env << EOF
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_API_BASE_URL=http://localhost:3000
EOF

# Start dev server
npm run dev
```

Open http://localhost:5173 in your browser.

### 5. Ultramsg.com Integration

1. Sign up at [ultramsg.com](https://ultramsg.com)
2. Create a new Instance
3. Get your credentials:
   - **Instance ID**: From Instance page
   - **Token**: From Instance > API settings
4. Add credentials to backend `.env`:
   ```
   ULTRAMSG_TOKEN=your_token_here
   ULTRAMSG_INSTANCE_ID=your_instance_id_here
   ```

5. Configure webhook in Ultramsg dashboard:
   - Go to Settings > Webhook
   - Enable "Webhook on Received"
   - Set webhook URL:
     - For production: `https://your-domain.com/webhooks/whatsapp`
     - For local dev: Use ngrok:
       ```bash
       ngrok http 3000
       # Use the https URL from ngrok output
     ```

### 6. Seed Initial Data (Optional)

Create a test court and player:

```bash
# Create court
curl -X POST http://localhost:3000/courts \
  -H "Content-Type: application/json" \
  -d '{"name": "Central Court"}'

# Create player
curl -X POST http://localhost:3000/players \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "phone": "+1234567890",
    "level": "4.5",
    "position": "Left",
    "trust_score": 85
  }'
```

## Testing the Flow

1. **Create a match** via frontend UI:
   - Click "Create Match"
   - Select court, time, and players
   - Click "Create & Send Invitations"

2. **Check invitations were created**:
   ```bash
   curl http://localhost:3000/invitations
   ```

3. **Simulate WhatsApp reply** (if webhook not configured):
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

4. **Check match status updated**:
   ```bash
   curl http://localhost:3000/matches
   # Should show updated confirmed_count
   ```

## Troubleshooting

### Backend won't start
- Check Node.js version: `node --version` (should be 18+)
- Check .env file exists and has all required variables
- Check Supabase credentials are correct

### Frontend can't connect to Supabase
- Verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env
- Check browser console for errors
- Verify Supabase project is active

### Webhook not receiving messages
- Check ngrok is running (for local dev)
- Verify webhook URL in Ultramsg dashboard
- Check backend logs for incoming requests
- Adjust payload structure in webhook controller if needed

### Real-time updates not working
- Verify Supabase Realtime is enabled in project settings
- Check browser console for subscription errors
- Verify RLS policies allow reads

## Next Steps

- Integrate payment provider (Stripe/PayPal)
- Add authentication for admin users
- Customize WhatsApp message templates
- Add match analytics dashboard
- Implement automated matchmaking suggestions

