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
        "on-tertiary": "#ffffff",
        "on-primary-fixed": "#1b1b1b",
        "surface-dim": "#dadad9",
        "on-primary-container": "#848484",
        "secondary-fixed-dim": "#b1c5ff",
        "inverse-primary": "#c6c6c6",
        "secondary-fixed": "#dae2ff",
        "inverse-surface": "#2f3130",
        "on-error-container": "#93000a",
        "primary": "#000000",
        "surface-primary": "#FFFFFF",
        "on-tertiary-container": "#848484",
        "tertiary-fixed": "#e2e2e2",
        "text-muted": "#6B6B6B",
        "surface-tint": "#5e5e5e",
        "background": "#faf9f8",
        "surface-bright": "#faf9f8",
        "on-tertiary-fixed-variant": "#474747",
        "on-secondary-fixed": "#001946",
        "surface-container-highest": "#e3e2e1",
        "primary-container": "#1b1b1b",
        "tertiary-fixed-dim": "#c6c6c6",
        "error-container": "#ffdad6",
        "on-surface": "#1a1c1c",
        "error": "#ba1a1a",
        "secondary-container": "#096cfa",
        "secondary": "#0055c9",
        "inverse-on-surface": "#f1f0ef",
        "on-background": "#1a1c1c",
        "outline-variant": "#cfc4c5",
        "on-surface-variant": "#4c4546",
        "surface-container-high": "#e9e8e7",
        "surface-container-low": "#f4f3f2",
        "on-secondary": "#ffffff",
        "on-primary-fixed-variant": "#474747",
        "on-tertiary-fixed": "#1b1b1b",
        "surface-container-lowest": "#ffffff",
        "primary-fixed": "#e2e2e2",
        "surface-container": "#efeeed",
        "border-subtle": "#E9E8E7",
        "on-error": "#ffffff",
        "on-secondary-container": "#fefcff",
        "on-primary": "#ffffff",
        "surface-secondary": "#F6F5F4",
        "primary-fixed-dim": "#c6c6c6",
        "surface": "#faf9f8",
        "tertiary": "#000000",
        "surface-variant": "#e3e2e1",
        "on-secondary-fixed-variant": "#00419e",
        "outline": "#7e7576",
        "tertiary-container": "#1b1b1b"
      },
      borderRadius: {
        DEFAULT: "0.125rem",
        lg: "0.25rem",
        xl: "0.5rem",
        full: "0.75rem"
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
