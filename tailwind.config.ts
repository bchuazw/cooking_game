import type { Config } from 'tailwindcss';

// Palette tokens from brief §8.
const palette = {
  'tile-teal': '#2BA59D',
  'tile-teal-tint': '#5FBFB8',
  'tile-teal-shade': '#1F7E78',
  sambal: '#D8432B',
  'sambal-tint': '#E36F5C',
  'sambal-shade': '#A93521',
  pandan: '#6FB552',
  'pandan-tint': '#92C97A',
  'pandan-shade': '#558D40',
  kaya: '#E8B83A',
  'kaya-tint': '#EFCB6A',
  'kaya-shade': '#B58E27',
  marble: '#F4EFE6',
  ink: '#1B1A1A',
  outline: '#3A2D24',
};

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: palette,
      fontFamily: {
        display: ['"M PLUS Rounded 1c"', '"Noto Sans JP"', 'system-ui', 'sans-serif'],
        body: ['"Noto Sans JP"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 6px 18px -8px rgba(58, 45, 36, 0.35)',
        chip: '0 2px 0 0 rgba(58, 45, 36, 0.25)',
      },
      borderRadius: {
        chip: '14px',
      },
    },
  },
  plugins: [],
} satisfies Config;
