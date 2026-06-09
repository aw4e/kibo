import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: { "2xl": "480px" },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "flame-pulse": {
          "0%, 100%": { transform: "scale(1) rotate(-3deg)" },
          "50%": { transform: "scale(1.14) rotate(3deg)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "float-sm": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-5px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "pop-in": {
          from: { transform: "scale(0.7)", opacity: "0" },
          to: { transform: "scale(1)", opacity: "1" },
        },
        "bounce-in": {
          "0%": { transform: "scale(0.5)", opacity: "0" },
          "60%": { transform: "scale(1.1)", opacity: "1" },
          "80%": { transform: "scale(0.95)" },
          "100%": { transform: "scale(1)" },
        },
        "slide-down": {
          from: { opacity: "0", transform: "translateY(-8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "spin-slow": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        "spin-slow-r": {
          from: { transform: "rotate(360deg)" },
          to: { transform: "rotate(0deg)" },
        },
        sparkle: {
          "0%, 100%": { opacity: "1", transform: "scale(1) rotate(0deg)" },
          "25%": { opacity: "0.5", transform: "scale(1.3) rotate(20deg)" },
          "50%": { opacity: "0.2", transform: "scale(0.7) rotate(-10deg)" },
          "75%": { opacity: "0.7", transform: "scale(1.1) rotate(8deg)" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(0deg)" },
          "20%": { transform: "rotate(-12deg)" },
          "40%": { transform: "rotate(12deg)" },
          "60%": { transform: "rotate(-6deg)" },
          "80%": { transform: "rotate(6deg)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        "flame-pulse": "flame-pulse 2.4s ease-in-out infinite",
        float: "float 3.2s ease-in-out infinite",
        "float-sm": "float-sm 2.6s ease-in-out infinite",
        shimmer: "shimmer 1.4s ease-in-out infinite",
        "pop-in": "pop-in 280ms cubic-bezier(0.34,1.56,0.64,1)",
        "bounce-in": "bounce-in 600ms cubic-bezier(0.34,1.56,0.64,1)",
        "slide-down": "slide-down 280ms cubic-bezier(0.25,0.46,0.45,0.94)",
        "spin-slow": "spin-slow 10s linear infinite",
        "spin-slow-r": "spin-slow-r 13s linear infinite",
        sparkle: "sparkle 3.2s ease-in-out infinite",
        wiggle: "wiggle 0.5s ease-in-out",
        "pulse-glow": "pulse-glow 2.5s ease-in-out infinite",
      },
      maxWidth: {
        app: "480px",
        content: "1280px",
      },
      fontFamily: {
        sans: [
          "var(--font-dm-sans)",
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "sans-serif",
        ],
        display: [
          "var(--font-cormorant)",
          "Georgia",
          "Times New Roman",
          "serif",
        ],
        serif: [
          "var(--font-cormorant)",
          "Georgia",
          "serif",
        ],
        jakarta: [
          "var(--font-dm-sans)",
          "-apple-system",
          "system-ui",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
