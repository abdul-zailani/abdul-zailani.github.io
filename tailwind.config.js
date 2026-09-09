/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./_includes/**/*.{html,js}",
    "./_layouts/**/*.{html,js}",
    "./_posts/**/*.{html,md}",
    "./projects/**/*.{html,md,txt}",
    "./blog/**/*.{html,md}",
    "./*.{html,md}"
  ],
  theme: {
    extend: {
      colors: {
        "primary": "#0F172A",
        "on-primary": "#FFFFFF",
        "secondary": "#2563EB",
        "on-secondary": "#FFFFFF",
        "secondary-container": "#EFF6FF",
        "on-secondary-container": "#1D4ED8",
        "surface": "#FAF9F8",
        "surface-bright": "#FFFFFF",
        "surface-dim": "#E2E8F0",
        "surface-primary": "#FFFFFF",
        "surface-secondary": "#F1F5F9",
        "surface-container-lowest": "#FFFFFF",
        "surface-container-low": "#F8FAFC",
        "surface-container": "#F1F5F9",
        "surface-container-high": "#E2E8F0",
        "surface-container-highest": "#CBD5E1",
        "on-surface": "#0F172A",
        "on-surface-variant": "#475569",
        "text-muted": "#64748B",
        "border-subtle": "#E2E8F0",
        "outline": "#94A3B8",
        "outline-variant": "#CBD5E1",
        "error": "#BA1A1A",
        "error-container": "#FFDAD6",
        "on-error": "#FFFFFF"
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        md: "0.375rem",
        lg: "0.5rem",
        xl: "0.75rem",
        full: "9999px"
      },
      maxWidth: {
        "container-max": "1200px"
      },
      padding: {
        "margin-desktop": "48px",
        "margin-mobile": "16px"
      },
      spacing: {
        "margin-desktop": "48px",
        "container-max": "1200px",
        gutter: "24px",
        "sidebar-width": "240px",
        unit: "4px",
        "margin-mobile": "16px"
      },
      fontFamily: {
        "body-lg": ["Geist", "sans-serif"],
        mono: ["Geist Mono", "Geist", "monospace"],
        h3: ["Geist", "sans-serif"],
        "body-md": ["Geist", "sans-serif"],
        h2: ["Geist", "sans-serif"],
        "label-sm": ["Geist", "sans-serif"],
        "h1-mobile": ["Geist", "sans-serif"],
        h1: ["Geist", "sans-serif"],
        "label-md": ["Geist", "sans-serif"]
      },
      fontSize: {
        "body-lg": ["17px", { lineHeight: "1.6", fontWeight: "400" }],
        mono: ["14px", { lineHeight: "1.5", fontWeight: "400" }],
        h3: ["24px", { lineHeight: "1.4", letterSpacing: "-0.01em", fontWeight: "600" }],
        "body-md": ["15px", { lineHeight: "1.6", fontWeight: "400" }],
        h2: ["30px", { lineHeight: "1.3", letterSpacing: "-0.01em", fontWeight: "600" }],
        "label-sm": ["12px", { lineHeight: "1.2", letterSpacing: "0.02em", fontWeight: "500" }],
        "h1-mobile": ["32px", { lineHeight: "1.2", fontWeight: "700" }],
        h1: ["40px", { lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: "700" }],
        "label-md": ["14px", { lineHeight: "1.2", fontWeight: "500" }]
      }
    }
  },
  plugins: []
};
