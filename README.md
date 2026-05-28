SAKSHAM is a Next.js frontend with a FastAPI backend packaged as a Vercel Python function.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel + Supabase

Deploy this folder as one Vercel project. The frontend is served by Next.js and backend API requests to `/api/*` are routed to `api/index.py`, which imports `backend/app/main.py`.

Use these production environment variables in Vercel:

```env
APP_NAME=SAKSHAM
APP_VERSION=1.0.0
ENVIRONMENT=production
DEBUG=false
CORS_ORIGINS=https://YOUR-VERCEL-DOMAIN.vercel.app
FRONTEND_URL=https://YOUR-VERCEL-DOMAIN.vercel.app
JWT_SECRET=PASTE-YOUR-LONG-RANDOM-SECRET
DEMO_MODE=false
SERVERLESS_MODE=true
SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_ANON_KEY=YOUR-ANON-KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR-SERVICE-ROLE-KEY
GEMINI_API_KEY=YOUR-GEMINI-API-KEY
```

Leave `NEXT_PUBLIC_API_URL` empty for the single Vercel project setup. The app will call `/api` on the same domain.
