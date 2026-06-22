# Component & UI Standards

## 1. Hierarchy
- **UI Primitive:** Shared, low-level components (Buttons, Inputs) live in `@/components/ui`.
- **Feature Component:** Business-logic-heavy components live in `@/features/[name]/components`.
- **Composition:** Large pages should be composed of Feature Components, which in turn use UI Primitives.

## 2. Accessibility (a11y)
- **Radix UI:** Always prefer Radix UI primitives for complex parts (Modals, Dropdowns, Tabs) to ensure keyboard navigation and screen reader support.
- **Iconography:** Use `Lucide React` for all icons. Use the `size` prop instead of arbitrary classes for consistency.

## 3. The "Container/Presentational" Balance
- Components should focus on UI. Keep data-heavy logic in the custom hook. 
- If a component exceeds 200 lines, it MUST be broken down into smaller sub-components within the same feature folder.