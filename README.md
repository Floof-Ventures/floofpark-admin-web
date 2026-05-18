# floofpark-admin-web

Internal staff superadmin portal for FloofPark, served at `admin.floofpark.com`.

See spec: `floofpark-core/docs/superpowers/specs/2026-05-17-superadmin-portal-design.md`.

## Stack
Vite 8 · React 19 · TypeScript · TanStack Query · Zustand · react-router 7 · Tailwind 4 · shadcn/ui

## Dev
```bash
npm install
npm run dev   # http://localhost:5173 — proxies *.floofpark.app
npm test
npm run test:e2e
```

## Deploy (Wave 0: manual)
```bash
npm run build
npx wrangler@3 pages deploy ./frontend/dist --project-name floofpark-admin
```
