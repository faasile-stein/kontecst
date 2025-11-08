/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Kontecst Brand Colors
        brand: {
          DEFAULT: '#165DFF',
          light: '#1FB1FF',
          dark: '#0E3FA8',
          50: '#EFF6FF',
          100: '#DBEAFE',
          500: '#165DFF',
          600: '#1449CC',
          700: '#0E3FA8',
        },
        // Neutral palette
        neutral: {
          0: '#FFFFFF',
          100: '#F8FAFC',
          200: '#F1F5F9',
          300: '#E2E8F0',
          400: '#D1D5DB',
          500: '#9CA3AF',
          600: '#6B7280',
          700: '#4B5563',
          800: '#1F2937',
          900: '#0F1724',
        },
        // Support colors
        success: {
          DEFAULT: '#10B981',
          light: '#6EE7B7',
          dark: '#059669',
        },
        warning: {
          DEFAULT: '#F59E0B',
          light: '#FCD34D',
          dark: '#D97706',
        },
        danger: {
          DEFAULT: '#EF4444',
          light: '#FCA5A5',
          dark: '#DC2626',
        },
        info: {
          DEFAULT: '#2563EB',
          light: '#93C5FD',
          dark: '#1D4ED8',
        },
        // Legacy support (mapped to new colors)
        primary: {
          DEFAULT: '#165DFF',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#F1F5F9',
          foreground: '#0F1724',
        },
        destructive: {
          DEFAULT: '#EF4444',
          foreground: '#FFFFFF',
        },
        muted: {
          DEFAULT: '#F8FAFC',
          foreground: '#6B7280',
        },
        accent: {
          DEFAULT: '#165DFF',
          foreground: '#FFFFFF',
        },
        border: '#D1D5DB',
        input: '#D1D5DB',
        ring: 'rgba(29, 78, 216, 0.28)',
        background: '#FFFFFF',
        foreground: '#0F1724',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display': ['48px', { lineHeight: '1.2', fontWeight: '700' }],
        'h1': ['36px', { lineHeight: '1.25', fontWeight: '700' }],
        'h2': ['28px', { lineHeight: '1.3', fontWeight: '600' }],
        'h3': ['22px', { lineHeight: '1.3', fontWeight: '600' }],
        'h4': ['18px', { lineHeight: '1.35', fontWeight: '600' }],
        'body': ['16px', { lineHeight: '1.5', fontWeight: '400' }],
        'small': ['14px', { lineHeight: '1.4', fontWeight: '400' }],
        'caption': ['13px', { lineHeight: '1.4', fontWeight: '400' }],
      },
      spacing: {
        '4.5': '18px',
        '18': '72px',
      },
      borderRadius: {
        'lg': '12px',
        'md': '8px',
        'sm': '6px',
        'xs': '4px',
      },
      boxShadow: {
        'soft': '0 6px 18px rgba(16, 24, 40, 0.06)',
        'card': '0 4px 12px rgba(16, 24, 40, 0.08)',
        'focus': '0 0 0 4px rgba(29, 78, 216, 0.12)',
        'lift': '0 8px 24px rgba(16, 24, 40, 0.12)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #165DFF 0%, #1FB1FF 100%)',
        'brand-gradient-hover': 'linear-gradient(135deg, #1449CC 0%, #1A9AE5 100%)',
      },
      keyframes: {
        'slide-in': {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        'slide-in': 'slide-in 0.2s ease-out',
        'fade-in': 'fade-in 0.15s ease-out',
        'scale-in': 'scale-in 0.12s ease-out',
      },
      transitionDuration: {
        '80': '80ms',
        '120': '120ms',
        '160': '160ms',
      },
    },
  },
  plugins: [],
}
