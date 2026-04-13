/**
 * Centralized animation constants to avoid magic numbers
 * Ensures consistency across dashboards and reduces duplication
 */

export const ANIMATION = {
  // Duration constants (in milliseconds)
  DURATION: {
    INSTANT: 0,
    VERY_FAST: 150,
    FAST: 200,
    NORMAL: 300,
    MEDIUM: 500,
    SLOW: 700,
    VERY_SLOW: 1000,
  },

  // Stagger delays for list animations (in seconds)
  STAGGER: {
    TIGHT: 0.02,
    COMPACT: 0.04,
    NORMAL: 0.05,
    RELAXED: 0.08,
    LOOSE: 0.1,
  },

  // Spring physics constants
  SPRING: {
    STIFF: { stiffness: 280, damping: 22 },
    NORMAL: { stiffness: 180, damping: 26 },
    BOUNCY: { stiffness: 120, damping: 14 },
  },

  // Easing functions
  EASING: {
    // Standard easing curves
    EASE_IN_OUT: [0.22, 1, 0.36, 1] as const,
    EASE_IN: [0.42, 0, 1, 1] as const,
    EASE_OUT: [0, 0, 0.58, 1] as const,
    LINEAR: [0.25, 0.46, 0.45, 0.94] as const,
  },

  // Pixel offset animations
  OFFSET: {
    MINIMAL: 4,
    SMALL: 8,
    MEDIUM: 12,
    LARGE: 14,
    XLARGE: 20,
  },

  // Scale/zoom animations
  SCALE: {
    MINIMAL: 0.95,
    SMALL: 0.9,
    MEDIUM: 0.85,
    LARGE: 0.8,
  },

  // Opacity animations
  OPACITY: {
    HIDDEN: 0,
    SUBTLE: 0.5,
    HALF: 0.5,
    VISIBLE: 1,
  },

  // Blur animations
  BLUR: {
    NONE: 0,
    SUBTLE: "2px",
    NORMAL: "4px",
    HEAVY: "8px",
  },
} as const;

/**
 * Pre-configured motion variants for common animation patterns
 * Reduces repetition and ensures consistency
 */
export const MOTION_VARIANTS = {
  // Fade and slide up - common entry animation
  fadeUp: {
    hidden: { opacity: 0, y: ANIMATION.OFFSET.MEDIUM },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: ANIMATION.DURATION.NORMAL / 1000,
        ease: ANIMATION.EASING.EASE_IN_OUT,
      },
    },
  },

  // Fade in with scale
  fadeScale: {
    hidden: { opacity: 0, scale: ANIMATION.SCALE.MINIMAL },
    show: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: ANIMATION.DURATION.FAST / 1000,
      },
    },
  },

  // Container animation with staggered children
  containerStagger: (stagger: number = ANIMATION.STAGGER.NORMAL) => ({
    hidden: {},
    show: {
      transition: {
        staggerChildren: stagger,
      },
    },
  }),

  // Tap/click animation
  tapScale: {
    whileTap: { scale: ANIMATION.SCALE.SMALL },
  },
} as const;
