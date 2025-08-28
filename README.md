# CRM-Luiska

This repository hosts a Next.js 14 CRM prototype powered by Supabase.

## Setup

1. Install dependencies

```bash
npm install
```

2. Create a `.env.local` file with your Supabase project keys:

```
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

## Development

Run the local dev server:

```bash
npm run dev
```

## Login

Visit `/login` and sign in with a Supabase Auth user. On success the page reloads and the middleware redirects you to `/oportunidades`.
If nothing happens, ensure your credentials and environment variables are correct.
