import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://karacho.peterkurzok.de',
  // The Markdown texts keep their straight quotes.
  markdown: { smartypants: false },
});
