# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Intelligent Tenant Engagement & Assistant** — a pilot system for CPN (Central Pattana) enabling:
- **Component A**: Customer-facing AI chatbot (24/7 inbound lead capture)
- **Component B**: Internal AI assistant for call centre / leasing staff (unit recommendations, lead scoring)
- **Admin Panel**: Knowledge base management, unit availability

Three-tier architecture: React/TypeScript frontend → Python/FastAPI backend (Cloud Run) → Firebase (Auth, Firestore, Storage) + Pinecone vector DB + OpenAI GPT-4o.

## Development Commands

```bash
npm run dev          # Start Vite dev server on port 3000
npm run build        # Vite build + TypeScript compile
npm run test         # Run Vitest unit tests
npm run lint         # ESLint
npm run check        # Prettier write + ESLint fix (formats and lints)
```

To run a single test file:
```bash
npx vitest run src/path/to/file.test.tsx
```

## Architecture

### Frontend (`src/`)

- **Router**: Code-based TanStack Router. Routes are defined in `src/main.tsx` — add new routes with `createRoute` and register them in the `routeTree`. The root layout (Header + Outlet) is in the `rootRoute`.
- **Forms**: TanStack Form + Zod for validation. Form context pattern shown in `src/hooks/`.
- **UI**: shadcn/ui (Radix UI primitives + Tailwind CSS v4). Components live in `src/components/ui/`. Add new components via:
  ```bash
  pnpx shadcn@latest add <component-name>
  ```
- **Path alias**: `@` resolves to `./src` (configured in `vite.config.ts`).
- **Styling**: Tailwind CSS v4 (via `@tailwindcss/vite` plugin — no `tailwind.config.js` needed).
- **Tests**: Vitest with jsdom environment. Test files use `*.test.tsx` naming.

### Demo Files

Files and directories prefixed with `demo` (e.g., `demo.form.simple.tsx`, `demo.form-context.ts`) are starter examples and can be safely deleted.

### Backend (planned — not yet in repo)

Per `design-document.md`: Python 3.12 + FastAPI + LangChain 0.3, deployed on Cloud Run.

Key API endpoints:
- `POST /api/v1/chat/{sessionId}/message` — RAG chat (SSE streaming response)
- `POST /api/v1/recommend` — merchant profile → unit recommendations

RAG pipeline: embed query → Pinecone similarity search (k=5) → GPT-4o with CPN knowledge base context.

### Firebase

- Firebase Auth: anonymous sessions for chatbot, Google SSO for internal staff (custom claims: `role=agent|sales|admin`)
- Firestore: malls, units, leads, conversation history
- Firebase Storage: knowledge base documents
- FCM: lead alerts to sales reps
