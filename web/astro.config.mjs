// The beta landing page (handoff/15-landing-page.md §2): Astro writes plain HTML; React runs only for the form island.
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://trykitted.com',
  integrations: [react()],
  vite: { plugins: [tailwindcss()] },
  build: { inlineStylesheets: 'always', assets: 'assets' },
  compressHTML: true,
  devToolbar: { enabled: false },
});
