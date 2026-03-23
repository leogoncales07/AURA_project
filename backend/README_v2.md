# AURA Backend - Settings & Account System

Complete Node.js backend for AURA's account management, security, and settings.

## Features
- **Profile Management**: Get/Patch profile, unique username checks.
- **Avatar System**: Image upload (max 5MB), resizing to 400x400 WebP via `sharp`, Supabase Storage integration.
- **Settings**: Granular application settings (Wellness, Sleep, Notifications) with Redis caching.
- **Security**: 
  - 2FA Setup & Verification (Speakeasy/TOTP).
  - Session Management (Revoke specific, Revoke all).
  - Audit Logging for all sensitive actions.
- **Privacy**: Data export jobs, data deletion flows, account soft-delete with anonymization.
- **Middleware**: JWT Auth (Supabase compatible), Rate Limiting, Request Validation (Zod), Global Error Handling.

## Tech Stack
- **Node.js + Express**
- **PostgreSQL** (Supabase)
- **Redis** (Caching & Rate Limiting)
- **Supabase JS Client** (Auth & Storage)
- **Sharp** (Image processing)
- **Zod** (Validation)

## Getting Started

1. **Environment Variables**:
   Update `.env` in the backend directory with:
   ```env
   DATABASE_URL=your_postgres_url
   REDIS_URL=your_redis_url
   JWT_SECRET=your_supabase_jwt_secret
   ENCRYPTION_KEY=32_char_master_key
   S_URL=your_supabase_url
   S_SERV=your_supabase_service_role_key
   ```

2. **Database Migration**:
   Run the SQL found in `src/db/migrations/20260315_settings_account_system.sql` in your Supabase SQL Editor.

3. **Running**:
   ```bash
   npm install
   npm run dev
   ```

## API Specification
- Base path: `/api/v1`
- Auth: `Authorization: Bearer <token>`
