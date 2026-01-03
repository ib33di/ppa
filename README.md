# PPA - Padel Club Match Invitation Platform

A production-ready full-stack system for managing padel club match invitations via WhatsApp. Built with NestJS, React, and Supabase.

## 🏗️ Architecture

- **Backend**: NestJS (TypeScript) with Supabase PostgreSQL
- **Frontend**: React (Vite + TypeScript) with Supabase client
- **Database**: Supabase PostgreSQL
- **Messaging**: AdWhats WhatsApp API
- **Real-time**: Supabase Realtime subscriptions

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- AdWhats API account and token

## 🚀 Setup Instructions

### 1. Supabase Setup

1. Create a new Supabase project at https://supabase.com
2. Run the SQL schema from `supabase/schema.sql` in your Supabase SQL Editor
3. Note your Supabase URL and create a Service Role Key (Settings > API)

### 2. Backend Setup

```bash
cd backend
npm install

# Create .env file
cp .env.example .env

# Edit .env with your credentials:
# SUPABASE_URL=your_supabase_url
# SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
# ADWHATS_API_TOKEN=your_adwhats_api_token
# ADWHATS_API_URL=https://api.adwhats.net
# ADWHATS_ACCOUNT_ID=1
# ADWHATS_WEBHOOK_TOKEN=your_webhook_token
# PORT=3000

# Start development server
npm run start:dev
```

The backend will run on `http://localhost:3000`

### 3. Frontend Setup

```bash
cd frontend
npm install

# Create .env file
# VITE_SUPABASE_URL=your_supabase_url
# VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
# VITE_API_BASE_URL=http://localhost:3000

# Start development server
npm run dev
```

The frontend will run on `http://localhost:5173`

### 4. AdWhats Webhook Configuration

Configure your AdWhats webhook to point to:
```
POST http://your-domain.com/webhooks/whatsapp
```

**For local development**, use a tool like ngrok to expose your local server:
```bash
ngrok http 3000
# Use the ngrok URL in AdWhats webhook settings
```

Expected payload format (based on AdWhats API):
```json
{
  "whatsapp_account_id": 1,
  "from": "966512345678",
  "message": "YES"
}
```

**Webhook Header**: AdWhats sends `webhook-token` header for verification. Set `ADWHATS_WEBHOOK_TOKEN` in your `.env` file.

**Note**: The system is now configured to match AdWhats API format exactly.

## 📁 Project Structure

```
├── backend/
│   ├── src/
│   │   ├── supabase/          # Supabase service
│   │   ├── players/           # Players module
│   │   ├── courts/            # Courts module
│   │   ├── matches/           # Matches module
│   │   ├── invitations/       # Invitations module
│   │   ├── whatsapp/          # WhatsApp service
│   │   ├── webhooks/          # Webhook handlers
│   │   └── payments/           # Payments module
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── hooks/             # Custom hooks
│   │   ├── lib/               # Utilities (Supabase, API)
│   │   └── App.tsx            # Main app component
│   └── package.json
├── supabase/
│   └── schema.sql             # Database schema
└── demo/                      # Original MVP demo
```

## 🔄 Flow

1. **Admin creates a match**
   - Selects court and time
   - Selects players from database
   - System creates match and invitations

2. **WhatsApp invitations sent**
   - System sends invitations via AdWhats API
   - Each invitation is tracked in database

3. **Players reply via WhatsApp**
   - Player replies "YES" or "NO"
   - AdWhats webhook receives reply
   - Webhook endpoint processes reply

4. **Status updates**
   - Invitation status updated in database
   - Match confirmed_count updated
   - If YES: Payment link sent automatically
   - Frontend updates via Supabase Realtime

5. **Match locks**
   - When confirmed_count reaches target_count
   - Match status changes to "Locked"
   - Final notifications sent

## 🗄️ Database Schema

### Tables

- **courts**: Court information
- **players**: Player profiles with trust scores
- **matches**: Match scheduling
- **invitations**: Individual player invitations
- **payments**: Payment tracking

See `supabase/schema.sql` for full schema with foreign keys and constraints.

## 🔌 API Endpoints

### Matches
- `GET /matches` - List all matches
- `GET /matches/:id` - Get match details
- `POST /matches` - Create match
- `PATCH /matches/:id` - Update match

### Players
- `GET /players` - List all players
- `GET /players/:id` - Get player details
- `POST /players` - Create player
- `PATCH /players/:id` - Update player

### Invitations
- `GET /invitations` - List invitations
- `GET /invitations?matchId=:id` - Get invitations for match
- `POST /invitations/batch` - Create multiple invitations
- `PATCH /invitations/:id` - Update invitation status

### WhatsApp
- `POST /whatsapp/send-invitation` - Send invitation via WhatsApp

### Webhooks
- `POST /webhooks/whatsapp` - Handle incoming WhatsApp messages

### Payments
- `GET /payments` - List payments
- `POST /payments` - Create payment
- `POST /payments/:id/paid` - Mark payment as paid

## 🔐 Environment Variables

### Backend (.env)
```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ADWHATS_API_TOKEN=your_adwhats_api_token
ADWHATS_API_URL=https://api.adwhats.net
ADWHATS_ACCOUNT_ID=1
ADWHATS_WEBHOOK_TOKEN=your_webhook_token
PORT=3000
NODE_ENV=development
```

### Frontend (.env)
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_BASE_URL=http://localhost:3000
```

## 🧪 Testing the Flow

1. **Create a player**:
   ```bash
   curl -X POST http://localhost:3000/players \
     -H "Content-Type: application/json" \
     -d '{"name": "John Doe", "phone": "+1234567890", "level": "4.5"}'
   ```

2. **Create a court**:
   ```bash
   curl -X POST http://localhost:3000/courts \
     -H "Content-Type: application/json" \
     -d '{"name": "Central Court"}'
   ```

3. **Create a match** via frontend UI or API

4. **Send invitations** - Automatically triggered when match is created

5. **Test webhook** (simulate WhatsApp reply):
   ```bash
   curl -X POST http://localhost:3000/webhooks/whatsapp \
     -H "Content-Type: application/json" \
     -d '{"from": "+1234567890", "message": "YES", "message_id": "test_123"}'
   ```

## 📝 Notes

- The demo folder contains the original MVP with UI ideas and flows
- The production system refactors and evolves the demo logic
- Supabase Realtime enables live updates without page refresh
- Payment integration is placeholder - integrate with Stripe/PayPal as needed
- AdWhats API structure may vary - adjust `whatsapp.service.ts` accordingly

## 🚧 Future Enhancements

- [ ] Payment provider integration (Stripe/PayPal)
- [ ] Admin authentication
- [ ] Email notifications fallback
- [ ] Match analytics dashboard
- [ ] Player rating system
- [ ] Automated matchmaking suggestions

## 📄 License

Private project - All rights reserved

