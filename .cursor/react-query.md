# React Query Standards

## 1. Global Error Handling & Toasts
- **Centralized Management:** All error notifications MUST be handled globally via `QueryCache` and `MutationCache` callbacks during `QueryClient` initialization.
- **Component Cleanliness:** DO NOT use `toast.error()` or trigger notification popups inside individual components, custom hooks, `onSuccess`, or `onError` callbacks.
- **Visual Feedback:** Components should only use the `isError` or `error` state from hooks to update inline UI (e.g., red borders, error text), never for global notifications.

## 2. Query Keys (The Factory Pattern)
- **Strict Rule:** Never use inline string arrays for Query Keys (e.g., `['hotels']`).
- **Factory File:** Every feature MUST have a `query-keys.ts` file in its root.
- **Implementation:** Use a const object or factory function to manage keys to ensure consistency and prevent typos.
- **Example:**
  ```typescript
  export const hotelKeys = {
    all: ['hotels'] as const,
    lists: () => [...hotelKeys.all, 'list'] as const,
    detail: (id: string) => [...hotelKeys.all, 'detail', id] as const,
  };