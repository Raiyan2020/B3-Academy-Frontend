# Server-First & Hydration Strategy

## 1. Server Components (RSC)
- **Default State:** All components are Server Components by default.
- **'use client':** Use only for hooks, event listeners, or complex browser-only UI.

## 2. The Hydration Pattern
- **Prefetching:** Data MUST be fetched on the server using `QueryClient.prefetchQuery`.
- **No Prop Drilling:** Do not pass fetched data through multiple layers of props. 
- **Dehydration:** Wrap the prefetched data in `<HydrationBoundary state={dehydrate(queryClient)}>` to make it available to Client Components instantly.

## 3. Services
- All API calls must reside in the feature's `services/` folder.
- Use regular `async function` syntax.
- Every service function must be exported as a standard `export async function`.