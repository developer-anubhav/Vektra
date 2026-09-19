/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Zoho Puvi'", "'Plus Jakarta Sans'", "'Inter'", "system-ui", "-apple-system", "sans-serif"],
        heading: ["'Zoho Puvi'", "'Plus Jakarta Sans'", "'Outfit'", "sans-serif"],
        puvi: ["'Zoho Puvi'", "'Plus Jakarta Sans'", "'Inter'", "sans-serif"],
        'copilot-body': ["'Public Sans'", "system-ui", "-apple-system", "sans-serif"],
        'copilot-data': ["'IBM Plex Mono'", "monospace"],
        'copilot-quote': ["'Source Serif 4'", "Georgia", "serif"],
      },
      colors: {
        vektra: {
          blue: '#3D6AB8', // Tech Sapphire Blue (Primary)
          cyan: '#9DFFF9', // Electric Cyan Aqua (Glow Highlight)
          emerald: '#054D19', // Deep Emerald Green (Verified RAG)
          lavender: '#C7C1D7', // Soft Lavender (AI Response Bubble)
          taupe: '#7A5C58', // Muted Warm Taupe (User Bubble)
        },
        copilot: {
          header: '#3D6AB8',
          sparkle: '#9DFFF9',
          verified: '#054D19',
          aiMsg: '#C7C1D7',
          userMsg: '#7A5C58',
        },
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: "hsl(var(--card))",
        "card-foreground": "hsl(var(--card-foreground))",
        popover: "hsl(var(--popover))",
        "popover-foreground": "hsl(var(--popover-foreground))",
        primary: "hsl(var(--primary))",
        "primary-foreground": "hsl(var(--primary-foreground))",
        secondary: "hsl(var(--secondary))",
        "secondary-foreground": "hsl(var(--secondary-foreground))",
        muted: "hsl(var(--muted))",
        "muted-foreground": "hsl(var(--muted-foreground))",
        accent: "hsl(var(--accent))",
        "accent-foreground": "hsl(var(--accent-foreground))",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      borderRadius: {
        lg: "0.75rem",
        md: "calc(0.75rem - 2px)",
        sm: "calc(0.75rem - 4px)",
      },
      animation: {
        'slow-drift': 'drift 20s infinite alternate linear',
        'pulse-slow': 'pulse 6s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        drift: {
          '0%': { transform: 'translate(0, 0) scale(1)' },
          '100%': { transform: 'translate(50px, 30px) scale(1.1)' },
        }
      }
    },
  },
  plugins: [],
}

