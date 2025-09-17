# KeyFate (Dead Man's Switch)

A secure digital service that automatically triggers an alarm or other emergency response when the user is incapacitated.

## 🚀 Quick Start (Local Development)

**New! Complete local development environment** - no Supabase required:

```bash
# 1. Set up local environment
make install

# 2. Start development stack
make dev

# 3. Open application
open http://localhost:3000
```

**Development credentials:**
- dev@localhost / password123 (Free tier)
- test@localhost / password123 (Pro tier)

For detailed setup instructions, see [INFRASTRUCTURE.md](./INFRASTRUCTURE.md)

## Alternative Setup Options

1. **Deploy Infrastructure:** See [Infrastructure README](infrastructure/README.md) for automated Terragrunt deployment
2. **Frontend Development:** See [Frontend README](frontend/README.md) for local development setup
3. **Supabase Setup:** Deploy database and functions with `supabase deploy`

## Tech Stack

### Local Development
- **Frontend:** Next.js, TypeScript, Tailwind CSS, Shadcn UI
- **Database:** PostgreSQL 16 (Docker)
- **ORM:** Drizzle ORM
- **Orchestration:** Docker Compose, Make
- **Caching:** Redis 7 (optional)

### Production Options
- **Legacy:** Supabase (Postgres, Auth, Edge Functions)
- **Infrastructure:** Google Cloud Run, Terraform, Terragrunt
- **Security:** Client-side Shamir's Secret Sharing, Secret Manager

## SSL Authentication

For secure connections to Supabase with SSL enforcement enabled, you need to download and configure the CA certificate:

1. **Download the CA certificate** from your Supabase project dashboard under Database Settings > SSL Configuration
2. **Add the certificate to your trusted authorities**:

   ```bash
   cat {location of downloaded prod-ca-2021.crt} >> ~/.postgres/root.crt
   ```

3. **Connect using `verify-full` SSL mode** for maximum security:

   ```bash
   psql "postgresql://aws-0-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=verify-full" -U postgres.<user>
   ```

For more details, see the [Supabase SSL Enforcement documentation](https://supabase.com/docs/guides/platform/ssl-enforcement).

## TODO

- [x] Add tests
- [x] Enable users to pause and reactivate secrets
- [x] Reminders to check in
- [x] ToS and Privacy Policy
- [x] New secret email
- [ ] SMS reminders
- [ ] Security audit
- [ ] Fix Google Auth
- [ ] Deploy to staging and prod
- [ ] Test crons are working
- [ ] Email verification for user.meta.email_verified not being set to true. Also need to enable email verify with OTP.
- [ ] [SMTP set up](https://supabase.com/dashboard/project/kvutysvqnqvcqjhduqpd/auth/templates)
- [ ] [Update URL configuration](https://supabase.com/dashboard/project/kvutysvqnqvcqjhduqpd/auth/url-configuration)

Reminder email needs to handle more than 50 reminders.
