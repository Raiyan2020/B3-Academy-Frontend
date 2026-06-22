# Feature-Based Architecture & TS Standards

> **Path note:** Directory layout defers to `AGENTS.md`. Feature code lives in `src/features/`, routes in `src/app/`.

## 1. Directory Structure
- **Root:** `src/features/[feature-name]/`
- **Mandatory Sub-folders:** - `components/`: UI units.
  - `hooks/`: Feature-specific logic.
  - `services/`: Data fetching and business logic.
 
## 2. Naming Conventions
- **Files:** Use `kebab-case.tsx` or `kebab-case.ts`.
- **Components:** Use **PascalCase** for the function name.
- **Match:** The filename must be the kebab-case version of the component name (e.g., `user-profile.tsx` for `UserProfile`).

## 3. Strict Coding Syntax
- **Language:** TypeScript ONLY. No `.js` allowed. No `any` type allowed.
- **Function Syntax:** Use **regular functions** (`function Name() {}`). Never use arrow functions for components or top-level service functions.
- **One Component Per File:** Each file must export exactly one component. Helper components must be moved to their own files.
- **Exports:** You MUST use an inline default export for the primary component (e.g., export default function ComponentName() { ... }). Do not export at the bottom of the file.


## 4. Verified Service Creation (The "Check-Before-Type" Rule)
- **Mandate:** Before defining any TypeScript interfaces for a new service, you MUST perform a "Schema Discovery" step.
- **The Protocol:**
  1. **Identify the Endpoint:** Determine the exact Backend route (e.g., `/api/properties/{id}`).
  2. **Fetch Real Data:** Use the internal `curl` or `fetch` tool to request a sample response from the actual endpoint (or mock server).
  3. **Validate:** Compare the actual JSON response against your assumptions. Check for:
     - Nullable fields (Is it `string` or `string | null`?).
     - Nested objects vs. flat IDs.
     - Date formats (ISO string vs. timestamp).
  4. **Type Generation:** Only AFTER seeing the real response, generate the TypeScript `interface`. 
 