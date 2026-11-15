# Horizen — community photography platform

A responsive Next.js + Supabase starter for a nature-first photography community.

## What is included

- Responsive editorial-style homepage and photo gallery
- Dark and light themes
- Demo gallery so the design is visible immediately
- Supabase email/password sign-up and sign-in
- Member photo uploads to Supabase Storage
- Category filters and gallery search
- Likes, comments and member-written stories
- Profile records and admin/moderator role foundation
- Row Level Security policies and storage rules
- Admin/moderator content deletion permissions in the database\n- Admin/moderator moderation queue for reports, with review/dismiss/remove actions\n- Member-facing report submission from a photograph detail view

## Important: this is a deployable starter, not a live hosted community yet

To make real accounts and community data work, you must connect a Supabase project and deploy the app. No hosting or database account can be created on your behalf from this source package. The app stays in preview mode until Supabase environment variables are supplied.

## 1. Create the free backend

1. Create a project at https://supabase.com/
2. In the project dashboard, open **SQL Editor**.
3. Paste and run `supabase/schema.sql`.
4. Open **Project Settings → API** and copy the Project URL and anon/public key.
5. In **Authentication → URL Configuration**, add your local URL `http://localhost:3000` and later your deployed URL.
6. Email confirmation can remain enabled. Configure the email provider/settings before opening registration publicly.

## 2. Configure and run locally

Install Node.js 20 or newer, then:

```bash
npm install
cp .env.example .env.local
```

Put your Supabase URL and anon key in `.env.local`, then:

```bash
npm run dev
```

Open http://localhost:3000

## 3. Make yourself the administrator

1. Create your account through the site.
2. In Supabase → SQL Editor, run the following with the email you registered:

```sql
update public.profiles
set role = 'admin'
where id = (
  select id from auth.users where email = 'YOUR_EMAIL'
);
```

Only do this for your own trusted founder account. Do not expose the Supabase service-role key in the browser or in `.env.local`.

## 4. Deploy free

1. Push this folder to a private or public GitHub repository.
2. Import the repository into https://vercel.com/
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel project environment variables.
4. Deploy, then add the Vercel URL to Supabase Authentication → URL Configuration.

Free-tier limits apply to hosting, database, image storage, bandwidth and email. Review current provider limits before inviting a large community. A custom domain is optional and may cost money.

## Safety and moderation before public launch

- Keep community guidelines visible and appoint trusted moderators.
- Add report/block flows and a moderation queue before scaling. The database includes a reports table and role-based policies, but the starter UI does not yet include a complete moderation console.
- Set image size limits and allowed MIME types in Supabase Storage. The included bucket limit is 10 MB.
- Do not allow public uploads of video in this first release; video hosting can consume free storage and bandwidth quickly.
- Add rate limiting, abuse detection, account recovery and age-appropriate community safeguards before public promotion.
- Review image rights, privacy, consent and location metadata. Avoid exposing precise location data for sensitive wildlife or personal locations.

## Current scope / next development pass

The current starter includes account, photo, like, comment and story flows after Supabase setup, plus a basic admin/moderator report queue. It does not yet include following/follower relationships, video uploads, direct messages, notifications, account suspension controls, or advanced search. The moderation screen is a first-pass queue, not a full trust-and-safety console. Add rate limiting, stronger abuse prevention and a complete moderation workflow before broad public launch.
