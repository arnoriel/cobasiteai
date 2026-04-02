# 🚀 Panduan Setup Supabase + Google OAuth untuk CobasiteAI

## DAFTAR ISI
1. [Buat Project Supabase](#1-buat-project-supabase)
2. [Setup Google OAuth](#2-setup-google-oauth)
3. [SQL: Buat Tabel & Triggers](#3-sql-buat-tabel--triggers)
4. [Konfigurasi .env](#4-konfigurasi-env)
5. [Install Dependencies](#5-install-dependencies)
6. [Cara Kerja Sistem Credits](#6-cara-kerja-sistem-credits)
7. [Kelola User di Dashboard](#7-kelola-user-di-dashboard)

---

## 1. Buat Project Supabase

1. Buka **https://supabase.com** → Sign in / Sign up
2. Klik **"New project"**
3. Isi:
   - **Name**: `cobasiteai` (bebas)
   - **Database Password**: buat password kuat, **simpan baik-baik**
   - **Region**: pilih yang terdekat (misal: `Southeast Asia (Singapore)`)
4. Klik **"Create new project"** → tunggu ~2 menit sampai siap
5. Setelah siap, pergi ke **Settings → API**
6. Copy dua nilai ini ke `.env`:
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon public` key → `VITE_SUPABASE_ANON_KEY`

---

## 2. Setup Google OAuth

### A. Buat Google Cloud Project & OAuth Credentials

1. Buka **https://console.cloud.google.com**
2. Buat project baru atau pilih project yang ada
3. Pergi ke **APIs & Services → OAuth consent screen**
   - User Type: **External**
   - Isi App name, email, developer email
   - Klik **Save and Continue** sampai selesai
4. Pergi ke **APIs & Services → Credentials**
5. Klik **"+ CREATE CREDENTIALS" → OAuth 2.0 Client IDs**
6. Application type: **Web application**
7. Di **Authorized redirect URIs**, tambahkan:
   ```
   https://<PROJECT_REF>.supabase.co/auth/v1/callback
   ```
   (Ganti `<PROJECT_REF>` dengan ref project Supabase kamu — ada di Settings → API → URL bagian pertama)
8. Klik **Create** → copy **Client ID** dan **Client Secret**

### B. Aktifkan Google Provider di Supabase

1. Di Supabase dashboard → **Authentication → Providers**
2. Klik **Google** → toggle **Enable**
3. Masukkan:
   - **Client ID**: dari Google Console
   - **Client Secret**: dari Google Console
4. Klik **Save**

### C. Set Redirect URL di Supabase

1. **Authentication → URL Configuration**
2. **Site URL**: `http://localhost:5173` (untuk dev) atau domain produksi kamu
3. **Redirect URLs**: tambahkan:
   ```
   http://localhost:5173/**
   https://yourdomain.com/**
   ```
4. Klik **Save**

---

## 3. SQL: Buat Tabel & Triggers

Buka **SQL Editor** di Supabase Dashboard, lalu jalankan query-query berikut **satu per satu** (atau semuanya sekaligus):

### Query 1: Enable UUID Extension

```sql
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Query 2: Buat Tabel `profiles`

```sql
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  full_name     TEXT,
  avatar_url    TEXT,
  credits       INTEGER NOT NULL DEFAULT 3,
  is_subscribed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index untuk query cepat
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
```

### Query 3: Buat Tabel `websites`

```sql
CREATE TABLE IF NOT EXISTS public.websites (
  id          TEXT PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  prompt      TEXT NOT NULL DEFAULT '',
  source_code TEXT NOT NULL DEFAULT '',
  page_name   TEXT UNIQUE,
  deployed_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index agar query per user cepat
CREATE INDEX IF NOT EXISTS idx_websites_user_id ON public.websites(user_id);
CREATE INDEX IF NOT EXISTS idx_websites_page_name ON public.websites(page_name);
```

### Query 4: Row Level Security (RLS) — Isolasi Data Per User

```sql
-- Aktifkan RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.websites ENABLE ROW LEVEL SECURITY;

-- Profiles: user hanya bisa lihat & edit profil sendiri
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Websites: user hanya bisa CRUD website milik sendiri
CREATE POLICY "Users can view own websites"
  ON public.websites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own websites"
  ON public.websites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own websites"
  ON public.websites FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own websites"
  ON public.websites FOR DELETE
  USING (auth.uid() = user_id);

-- Page public: siapa pun bisa baca website yang sudah punya page_name (untuk share)
CREATE POLICY "Anyone can view deployed pages"
  ON public.websites FOR SELECT
  USING (page_name IS NOT NULL);
```

> ⚠️ **Penting**: Policy "Anyone can view deployed pages" dan "Users can view own websites"
> bisa overlap — Supabase menggunakan logika OR antar policies SELECT, jadi ini aman.

### Query 5: Trigger — Auto-buat Profile saat User Daftar

```sql
-- Function: dipanggil saat user baru sign up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, credits, is_subscribed)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    3,      -- 3 credits gratis
    FALSE   -- belum subscribe
  )
  ON CONFLICT (id) DO NOTHING;  -- aman kalau trigger dipanggil dua kali
  RETURN NEW;
END;
$$;

-- Trigger: fire setelah user baru dibuat di auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Query 6: Function `use_credit` — Atomic Credit Deduction

```sql
-- Function: kurangi 1 credit secara atomic
-- Return TRUE jika berhasil, FALSE jika credit habis
CREATE OR REPLACE FUNCTION public.use_credit(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_credits INTEGER;
BEGIN
  -- Lock row dulu untuk mencegah race condition
  SELECT credits INTO v_credits
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF v_credits IS NULL OR v_credits <= 0 THEN
    RETURN FALSE;
  END IF;

  UPDATE public.profiles
  SET credits = credits - 1,
      updated_at = NOW()
  WHERE id = p_user_id;

  RETURN TRUE;
END;
$$;
```

### Query 7: Scheduled Job — Reset Credits Jam 7 Pagi

```sql
-- Enable pg_cron extension (hanya bisa di Supabase Pro/Free jika di-enable)
-- Cek dulu di: Database → Extensions → cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Reset credits ke 3 setiap hari jam 07:00 WIB (00:00 UTC)
-- WIB = UTC+7, jadi jam 7 pagi WIB = jam 00:00 UTC
SELECT cron.schedule(
  'reset-daily-credits',         -- nama job (unik)
  '0 0 * * *',                   -- cron: jam 00:00 UTC = 07:00 WIB setiap hari
  $$
    UPDATE public.profiles
    SET credits = 3,
        updated_at = NOW()
    WHERE is_subscribed = FALSE;  -- hanya user yang TIDAK subscribe
  $$
);
```

> 💡 **Catatan pg_cron**:
> - Supabase Free tier mendukung pg_cron
> - Aktifkan di: **Database → Extensions → cron** → toggle ON
> - Setelah diaktifkan, jalankan query di atas
> - Cek jadwal: `SELECT * FROM cron.job;`
> - Lihat log: `SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;`

### Query 8: Function Updated_at Auto-Update

```sql
-- Function untuk auto-update kolom updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Trigger untuk profiles
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Trigger untuk websites
DROP TRIGGER IF EXISTS set_websites_updated_at ON public.websites;
CREATE TRIGGER set_websites_updated_at
  BEFORE UPDATE ON public.websites
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
```

---

## 4. Konfigurasi .env

Buat file `.env` di root project (copy dari `.env.example`):

```env
# Supabase
VITE_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# OpenRouter (untuk AI generation)
VITE_OPENROUTER_API_KEY=sk-or-v1-...

# Model AI
VITE_AI_MODEL=qwen/qwen3.6-plus-preview:free
```

---

## 5. Install Dependencies

```bash
# Masuk ke folder project
cd cobasiteai

# Install Supabase client
npm install @supabase/supabase-js

# Install semua dependencies lainnya (jika belum)
npm install

# Jalankan dev server
npm run dev
```

---

## 6. Cara Kerja Sistem Credits

### Flow Lengkap:

```
User Sign In Google
       ↓
Supabase trigger otomatis buat profil dengan credits = 3
       ↓
User generate website → use_credit() dipanggil (atomic)
       ↓
credits berkurang jadi 2 → 1 → 0
       ↓
Credits habis → UI blokir generate, tampilkan pesan
       ↓
Setiap hari jam 07:00 WIB:
  - User is_subscribed = FALSE → credits direset ke 3
  - User is_subscribed = TRUE  → TIDAK direset (kamu isi manual)
```

### Poin Penting:
- Credits **tidak ditambahkan**, tapi **direset ke 3** (jadi kalau user punya 1 sisa hari ini, besok jadi 3, bukan 4)
- User `is_subscribed = TRUE` tidak tersentuh oleh reset otomatis — kamu bebas set creditsnya berapa saja manual
- Function `use_credit` pakai `FOR UPDATE` lock, jadi aman dari race condition (user buka 2 tab sekaligus)

---

## 7. Kelola User di Dashboard

### Lihat Semua User + Credits:
Di Supabase → **Table Editor → profiles**

### Edit Credits Manual (untuk user subscribe):
```sql
-- Isi ulang credits untuk user tertentu
UPDATE public.profiles
SET credits = 100,       -- atau angka berapa saja
    is_subscribed = TRUE
WHERE email = 'user@email.com';

-- Atau langsung by user ID
UPDATE public.profiles
SET credits = 50
WHERE id = 'uuid-user-di-sini';
```

### Set User Jadi Subscriber:
```sql
UPDATE public.profiles
SET is_subscribed = TRUE
WHERE email = 'user@email.com';
```

### Reset Credits Manual Semua User (tanpa nunggu jam 7):
```sql
UPDATE public.profiles
SET credits = 3
WHERE is_subscribed = FALSE;
```

### Lihat Semua Website Per User:
```sql
SELECT 
  p.email,
  p.credits,
  p.is_subscribed,
  COUNT(w.id) as total_websites
FROM public.profiles p
LEFT JOIN public.websites w ON w.user_id = p.id
GROUP BY p.id, p.email, p.credits, p.is_subscribed
ORDER BY p.created_at DESC;
```

### Hapus Website User:
```sql
-- Hati-hati! Ini permanen
DELETE FROM public.websites WHERE user_id = 'uuid-user-di-sini';
```

---

## Checklist Setup

- [ ] Project Supabase dibuat
- [ ] Copy `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` ke `.env`
- [ ] Google Cloud Project dibuat + OAuth credentials
- [ ] Google provider diaktifkan di Supabase Authentication
- [ ] Redirect URL dikonfigurasi di Supabase
- [ ] Query 1-8 dijalankan di SQL Editor (urut)
- [ ] Extension `pg_cron` diaktifkan di Database → Extensions
- [ ] `npm install @supabase/supabase-js` dijalankan
- [ ] `npm run dev` berjalan tanpa error
- [ ] Test: sign in Google berhasil
- [ ] Test: profile otomatis terbuat dengan 3 credits
- [ ] Test: generate website mengurangi credits
- [ ] Test: website hanya muncul untuk user yang membuatnya
