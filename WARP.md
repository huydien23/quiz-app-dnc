# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project commands (pnpm)
- Install deps: pnpm install
- Dev server: pnpm dev
- Build: pnpm build
- Start (after build): pnpm start
- Lint: pnpm lint
- Tests: no test runner is configured (no jest/vitest/playwright/cypress configs or scripts). If tests are added later, prefer pnpm test and document how to run a single test.

Environment
- This app requires Firebase client env vars to run authentication and data features. Add them to .env.local (Next.js will load them):
  - NEXT_PUBLIC_FIREBASE_API_KEY
  - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
  - NEXT_PUBLIC_FIREBASE_DATABASE_URL
  - NEXT_PUBLIC_FIREBASE_PROJECT_ID
  - NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  - NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
  - NEXT_PUBLIC_FIREBASE_APP_ID

High-level architecture
- Framework and tooling
  - Next.js 14 App Router with TypeScript and TailwindCSS
  - Package manager: pnpm (pnpm-lock.yaml present)
  - Vercel Analytics client integrated
  - Path alias: @/* mapped to repo root (tsconfig.json)
- Runtime configuration (next.config.mjs)
  - ESLint and TypeScript errors are ignored during builds (eslint.ignoreDuringBuilds, typescript.ignoreBuildErrors)
  - Images are unoptimized (images.unoptimized: true)
  - Dev-only webpack watch polling enabled (helps on Windows/VMs)
  - reactStrictMode disabled
- Routing and layouts (app/)
  - Global layout app/layout.tsx wraps the app with:
    - Suspense and a top-level ErrorBoundary (components/error-boundary)
    - AuthProvider (hooks/use-auth) and ToastProvider (components/toast-provider)
    - Inter font and global styles (app/globals.css)
  - Route groups and key segments:
    - app/(marketing)/* — public marketing pages
    - app/login, app/register — auth entry points
    - app/dashboard/* — authenticated user dashboard
    - app/admin/* — admin area; see AdminLayout wrapper and AdminDashboard
    - app/quiz/[id] and app/quiz/[id]/result — quiz taking and results
- Authentication and authorization
  - Client-side auth context in hooks/use-auth.tsx using Firebase Auth (email/password + Google)
  - On first Google sign-in, a user record is created in Realtime Database under users/{uid}
  - Roles: role 0 = admin, 1 = user (see lib/types.ts)
  - ProtectedRoute component gates access and redirects unauthenticated users to /login; can require admin role
- Data layer (Firebase Realtime Database)
  - Initialization in lib/firebase.ts using NEXT_PUBLIC_* env vars; exports auth, database, googleProvider
  - Domain services (lib/*-service.ts) encapsulate DB access:
    - lib/quiz-service.ts: CRUD for quizzes (quizzes/), recording attempts (attempts/), result aggregation client-side
    - lib/admin-service.ts: admin queries across users, quizzes, attempts, system stats
    - lib/leaderboard-service.ts: aggregates user performance into leaderboard entries (fetches users, attempts, quizzes; computes ranks client-side)
  - Shared types in lib/types.ts (User, Quiz, Question, QuizAttempt, QuizResult, LeaderboardEntry)
- UI system
  - Design primitives in components/ui/* (Radix/shadcn-style components) used across pages
  - Higher-level app components in components/* (layouts, dashboards, quiz UIs, uploaders, analytics)
  - Tailwind configured via tailwind.config.js; global CSS variables and theming in app/globals.css

Notable implementation details
- Most pages are client components and rely on client-side data fetching from services
- Score and leaderboard calculations are performed in the client based on DB snapshots; for large datasets, consider server functions or pagination if performance becomes an issue
- The project uses @/* path alias across components, hooks, and libs; keep imports consistent with tsconfig

Lints and formatting
- Lint: next lint (no explicit eslint config present; Next.js defaults apply)
- Prettier: no explicit config found; Tailwind and PostCSS configured (postcss.config.mjs)

Files of interest
- package.json — scripts (build/dev/lint/start)
- next.config.mjs — build/runtime flags and dev webpack polling
- tsconfig.json — TypeScript and path alias configuration
- lib/firebase.ts — Firebase init (auth, database, provider)
- hooks/use-auth.tsx — auth context and user provisioning
- lib/quiz-service.ts, lib/admin-service.ts, lib/leaderboard-service.ts — data access and aggregation
- components/protected-route.tsx — route gating logic
- app/layout.tsx — global providers, ErrorBoundary, Suspense

External or assistant rules
- No CLAUDE.md, Cursor rules (.cursor/rules or .cursorrules), or GitHub Copilot instructions (.github/copilot-instructions.md) were found in this repo at the time of writing.
