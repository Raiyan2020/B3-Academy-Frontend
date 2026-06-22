export const staggerContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.1,
      staggerChildren: 0.08,
    },
  },
};

export const staggerItemVariants = {
  hidden: {
    opacity: 0,
    y: 35,
    rotate: -2,
    skewY: 1,
  },
  visible: {
    opacity: 1,
    y: 0,
    rotate: 0,
    skewY: 0,
    transition: {
      type: 'spring' as const,
      damping: 18,
      stiffness: 90,
    },
  },
};

export const staggerViewport = { once: true, amount: 0.15 } as const;

export function prefersReducedMotion() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
