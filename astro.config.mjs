// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from 'astro-sitemap';

export default defineConfig({
  site: 'https://dreamax.pages.dev',
  output: 'static',
  vite: {
    plugins: [tailwindcss()]
  },
  integrations: [sitemap()],
});
