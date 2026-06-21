# B3 Academy

B3 Academy is hosted by a Next.js App Router application. Route files live under `src/app`, while product areas live under `src/features`.

## Run Locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. Optional: set `GEMINI_API_KEY` in `.env.local` for the AI assistant. The key is only read by the server route at `src/app/api/ai/chat/route.ts`.

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Create a production build:
   ```bash
   npm run build
   ```

## Migration Notes

- Routing is handled by Next.js App Router in `src/app`.
- Global providers are composed in `src/app/providers.tsx`.
- Browser storage keys are centralized in `src/lib/storage/safe-local-storage.ts`.
- The old React Router API is temporarily bridged by `src/lib/routing/next-router-compat.tsx` while feature components are incrementally split into smaller components.
- The Gemini client is no longer imported by browser code; client chat calls go through `/api/ai/chat`.
# B3-Academy-Frontend
