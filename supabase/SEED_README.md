# KeyFate Database Seed Data (Drizzle + Postgres)

This seed file provides comprehensive test data for local development of the KeyFate dead man's switch platform using **Drizzle ORM and direct Postgres connections** (Supabase has been removed).

## 🔧 Prerequisites

- **Postgres Database**: Cloud SQL or local PostgreSQL instance
- **Environment Variables**: `DATABASE_URL` configured in `.env.local`
- **Node.js**: Version 18+ with npm/pnpm

## 🔧 How to Use

### Option A: Quick Setup (New Users)

**Best for quick testing without complex setup:**

1. **Apply database schema:** `cd frontend && npm run db:migrate`
2. **Start frontend:** `cd frontend && npm run dev`
3. **Sign up any test users** via your app's signup page
4. **Create secrets manually** through the app interface

✅ **Pros:** Simple, no pre-configuration needed
⚠️ **Cons:** No pre-seeded secrets with special timing scenarios

### Option B: Full Seed with Test Data (Recommended)

**Best for complete testing with all pre-seeded data using Drizzle + Postgres:**

1. **Ensure environment is configured:**
   ```bash
   # Make sure DATABASE_URL is set in frontend/.env.local
   echo $DATABASE_URL  # Should show your Postgres connection string
   ```

2. **Run the complete seed process:**
   ```bash
   cd frontend

   # Apply latest schema/migrations
   npm run db:migrate

   # Create test users with specific UUIDs and seed data
   node create-seed-users.js
   ```

✅ **Pros:** Complete seed data with special timing scenarios, realistic test data
⚠️ **Cons:** Requires Postgres database access

## 👥 Test Users

| Email | Password | Tier | Secrets | Special Features |
|-------|----------|------|---------|------------------|
| <ceo@aviat.io> | password123 | Pro | 3 | ⏰ Special timing scenarios |
| <john.doe@example.com> | password123 | Free | 1 | 🆓 Free tier limits |
| <alice.smith@company.com> | password123 | Pro | 4 | 📧📱 Email + Phone contact |
| <bob.wilson@startup.io> | password123 | Pro | 2 | 📱 Phone-only contact |

## ⏰ CEO Special Timing Scenarios

The `ceo@aviat.io` user has secrets designed to test different trigger scenarios:

1. **Bitcoin Wallet Recovery** - 🔴 **Already triggered** (2 days ago)
2. **Buried Gold Location** - 🟡 **Reminder ready in 30 seconds** (triggers in 5 minutes)
3. **Safe Combination** - 🟢 **Triggering in 30 days**

## 🗂️ Sample Secret Types

The seed includes various realistic secret types:

- 🪙 Bitcoin wallet seed phrases
- 🗺️ Buried treasure coordinates
- 🔐 Safe combinations
- 🏦 Bank account details
- 💻 Server access credentials
- 📋 Personal document locations

## 📊 Data Overview

- **4 users** (1 free, 3 pro tier)
- **10 secrets** with encrypted server shares
- **Multiple check-in history** entries per user
- **Reminder schedules** for active secrets
- **Contact method variety** (email, phone, both)
- **Admin notifications** for testing
- **Subscription data** with Paddle integration

## 🔐 Security Features

- All server shares use **AES-256-GCM encryption**
- Secrets implement **Shamir's Secret Sharing** (2-of-3 threshold)
- **Check-in tokens** for secure access
- **Recipient access tokens** for triggered secrets

## 🧪 Testing Scenarios

This seed data enables testing:

- ✅ Different subscription tiers and limits
- ✅ Secret triggering and expiration flows
- ✅ Contact method preferences (email/phone/both)
- ✅ Check-in reminder systems
- ✅ Admin notification workflows
- ✅ Secret sharing and recovery processes

### Testing Reminder System

To test the reminder processing system:

1. **Seed the database:** `cd supabase && make reset-and-seed`
2. **Start reminder processor:** `cd scripts && ./trigger-reminders.sh`
3. **Wait 30-60 seconds** - The "Buried Gold Location" secret for CEO will have a reminder ready to process
4. **Check logs** - You should see reminder processing activity in the script output

## 🔄 Refreshing Data

To refresh the seed data with the new Drizzle setup:

**Recommended approach:**

```bash
cd frontend

# Clear existing data and reseed
npm run db:reset  # If available, or manually drop/recreate tables
npm run db:migrate
node create-seed-users.js
```

**Alternative approach:**

```bash
cd frontend

# Just recreate users and data (preserves schema)
node create-seed-users.js
```

## 🛠️ Database Commands

For convenience, use these commands in the `frontend/` directory:

| Command | Description |
|---------|-------------|
| `npm run db:migrate` | Apply latest Drizzle schema migrations |
| `node create-seed-users.js` | Create test users and seed data via Drizzle |
| `npm run db:studio` | Open Drizzle Studio for database inspection |
| `npm run db:generate` | Generate new migration files from schema changes |

## 🔍 Troubleshooting

### No secrets showing in dashboard after login?

1. **Check database connection:**

   ```bash
   cd frontend
   echo $DATABASE_URL  # Ensure this is set correctly
   ```

2. **Verify the seed data using Drizzle Studio:**

   ```bash
   cd frontend
   npm run db:studio  # Opens web interface to inspect database
   ```

3. **Re-run the complete setup:**

   ```bash
   cd frontend
   npm run db:migrate
   node create-seed-users.js
   ```

### Common Issues

- **Environment Variables:** Ensure `DATABASE_URL` is properly configured in `.env.local`
- **Database Connectivity:** Test connection to your Postgres instance
- **Migration State:** Run `npm run db:migrate` to ensure schema is up to date
- **NextAuth Setup:** Verify NextAuth database tables exist and user sessions work correctly

## ⚠️ Important Notes

- **Development only** - Contains test data with hardcoded values
- **Encryption key** - Uses a fixed key for development consistency
- **Realistic timing** - Some secrets trigger soon for immediate testing
- **Complete coverage** - Tests all major features and edge cases
