/**
 * HeroUI Theme Adapter
 * Maps CSS variables to HeroUI component theming
 */

export const heroUIAdapter = {
  light: {
    colors: {
      background: "hsl(var(--background))",
      foreground: "hsl(var(--foreground))",
      divider: "hsl(var(--border))",
      focus: "hsl(var(--ring))",
      content1: "hsl(var(--card))",
      content2: "hsl(var(--muted))",
      content3: "hsl(var(--accent))",
      content4: "hsl(var(--secondary))",
      default: {
        DEFAULT: "hsl(var(--secondary))",
        foreground: "hsl(var(--secondary-foreground))",
      },
      primary: {
        DEFAULT: "hsl(var(--primary))",
        foreground: "hsl(var(--primary-foreground))",
      },
      secondary: {
        DEFAULT: "hsl(var(--secondary))",
        foreground: "hsl(var(--secondary-foreground))",
      },
      success: {
        DEFAULT: "hsl(var(--success))",
        foreground: "hsl(var(--success-foreground))",
      },
      warning: {
        DEFAULT: "hsl(var(--warning))",
        foreground: "hsl(var(--warning-foreground))",
      },
      danger: {
        DEFAULT: "hsl(var(--destructive))",
        foreground: "hsl(var(--destructive-foreground))",
      },
    },
  },
  dark: {
    colors: {
      background: "hsl(var(--background))",
      foreground: "hsl(var(--foreground))",
      divider: "hsl(var(--border))",
      focus: "hsl(var(--ring))",
      content1: "hsl(var(--card))",
      content2: "hsl(var(--muted))",
      content3: "hsl(var(--accent))",
      content4: "hsl(var(--secondary))",
      default: {
        DEFAULT: "hsl(var(--secondary))",
        foreground: "hsl(var(--secondary-foreground))",
      },
      primary: {
        DEFAULT: "hsl(var(--primary))",
        foreground: "hsl(var(--primary-foreground))",
      },
      secondary: {
        DEFAULT: "hsl(var(--secondary))",
        foreground: "hsl(var(--secondary-foreground))",
      },
      success: {
        DEFAULT: "hsl(var(--success))",
        foreground: "hsl(var(--success-foreground))",
      },
      warning: {
        DEFAULT: "hsl(var(--warning))",
        foreground: "hsl(var(--warning-foreground))",
      },
      danger: {
        DEFAULT: "hsl(var(--destructive))",
        foreground: "hsl(var(--destructive-foreground))",
      },
    },
  },
};
