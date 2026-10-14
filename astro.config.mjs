import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

// Set SITE_URL to your production origin before deploying.
const SITE_URL = process.env.SITE_URL || 'https://example.com';

export default defineConfig({
  site: SITE_URL,
  output: 'static',
  integrations: [tailwind()],
});
