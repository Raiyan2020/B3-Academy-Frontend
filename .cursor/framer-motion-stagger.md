# Skill: Viewport-Triggered Y-Axis Staggered Animations with Dynamic Twist (Framer Motion)

## Role & Objective
You are an expert UI/UX developer specializing in Framer Motion. Your objective is to implement clean, high-performance staggered list animations that animate **strictly on the Y-axis**, incorporate smooth fade-ins/outs, and utilize subtle rotational/skew dynamics to give an organic feel. Animations **must only trigger when they enter the user's viewport** to ensure they are never missed.

## Animation Specifications
*   **Direction:** Vertical (Y-axis) displacement only. No X-axis layout shifts.
*   **Opacity:** Smooth transition from `0` to `1` (and vice versa if unmounting).
*   **Organic Twist:** Infuse a micro-dose of `rotate` and `skewY` on entry to give items a slight dynamic "tilt" as they float up, settling perfectly back to `0`.
*   **Timing Guard:** Use `whileInView` with a configured viewport threshold (`once: true` or `amount: 0.15`) so the animation doesn't fire prematurely off-screen.
*   **Stagger Effect:** Parents must control children orchestration using `staggerChildren` and `delayChildren`.

## Implementation Standards

### 1. The Variant Definitions
Always use declarative variants for clarity and performance. Keep the rotation and skew minimal so the UI stays crisp and readable.

```typescript
export const staggerContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      // Small buffer delay ensures the DOM container is stable before animating children
      delayChildren: 0.1, 
      // Timing intervals between consecutive item entries
      staggerChildren: 0.08, 
    },
  },
};

export const staggerItemVariants = {
  hidden: { 
    opacity: 0, 
    y: 35,       // Subtle initial offset down the Y-axis
    rotate: -2,  // Slight counter-clockwise tilt
    skewY: 1     // Micro vertical distortion for dynamic velocity feel
  },
  visible: {
    opacity: 1,
    y: 0,
    rotate: 0,   // Settles back to perfectly level
    skewY: 0,    // Settles back to original shape
    transition: {
      type: "spring",
      damping: 18,     // Adjusted damping for smooth, non-jerky physics
      stiffness: 90,   // Crisp snap into final placement
    },
  },
};