# Tech Pursuit Systems — Website

Premium marketing website for **Tech Pursuit Systems** (IT Services & Digital
Transformation, with Talent Solutions as a supporting capability).

Next.js 15 (App Router) · TypeScript · Tailwind CSS · Framer Motion · GSAP ·
Lenis smooth scroll.

## Standalone by design

This folder is **fully self-contained** — it has its own `package.json`,
`tsconfig.json`, Tailwind/PostCSS/ESLint config, and no imports from anywhere
outside this directory. That means it works two ways:

1. **Inside the `rootora-ai` monorepo** — picked up automatically by the pnpm
   workspace (`apps/*`), installed and run like any other app here.
2. **Copied out on its own** — move this folder anywhere, `npm install` (or
   `pnpm install` / `yarn`), and it runs identically. No workspace
   dependencies, no references to `@rootora/*` packages, no monorepo-only
   tooling.

## Getting started

```bash
npm install
cp .env.example .env.local   # optional — see below
npm run dev                  # http://localhost:3000
```

Other scripts: `npm run build`, `npm run start`, `npm run lint`, `npm run typecheck`.

## Contact form

`POST /api/contact` validates input with Zod and sends email via
[Resend](https://resend.com) if configured. **No database is used anywhere in
this app.** Fill in `.env.local` from `.env.example`:

```
RESEND_API_KEY=
CONTACT_FROM_EMAIL=
CONTACT_TO_EMAIL=
```

Without these set, submissions still validate and the API returns success
(logged server-side, not persisted) — the form never breaks for visitors,
it just won't dispatch real email until you add the keys.

## Content status — placeholders to replace before launch

Everything below is clearly marked `placeholder: true` in its data file and
uses generic, non-fabricated copy (no invented client names, real people, or
addresses). Swap these in `src/lib/data/` before shipping publicly:

| File | What to replace |
| --- | --- |
| `src/lib/data/projects.ts` | Real case studies |
| `src/lib/data/testimonials.ts` | Real client quotes (with permission) |
| `src/lib/data/jobs.ts` | Real open roles (or wire to your ATS) |
| `src/app/contact/page.tsx` | Real email / office details |
| `.env.example` → `.env.local` | Resend credentials, `NEXT_PUBLIC_SITE_URL` |

`src/lib/data/services.ts`, `industries.ts`, and `technologies.ts` are
production-ready generic content and can stay as-is or be tuned to taste.

## Structure

```
src/
  app/            routes (Home, About, Services, Portfolio, Industries, Careers, Contact, API)
  components/
    layout/       Navbar, Footer, smooth-scroll provider
    ui/           shared primitives (buttons, reveal animations, section heading, ...)
    home/         homepage-only sections
    services/     interactive service explorer
    portfolio/    filterable project gallery
    contact/      contact form
  lib/
    data/         placeholder content (see table above)
    motion.ts     shared Framer Motion variants
    email.ts      Resend integration
  types/          shared TypeScript types
```

## Design system

Colors, type, and motion tokens live in `tailwind.config.ts` (`brand` = blue,
`gold` = accent, `ink` = neutrals) — derived from the Tech Pursuit Systems
logo. Fonts: Sora (display) + Inter (body), loaded via `next/font/google` in
`src/app/layout.tsx`.
