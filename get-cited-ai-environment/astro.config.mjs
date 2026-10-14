import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import { writeFileSync } from 'node:fs';

const production = new URL(process.env.SITE_URL || 'https://genesis-final-prototype.vercel.app');
if (production.protocol !== 'https:' || production.pathname !== '/' || production.search || production.hash || production.username || production.password || /(^|\.)example\.(com|org|net)$/.test(production.hostname)) {
  throw new Error('SITE_URL must be the real HTTPS production origin, without a path or credentials.');
}
const routes = ['/', '/about/', '/contact/', '/privacy/'];
export default defineConfig({
  site: production.origin,
  output: 'static',
  trailingSlash: 'always',
  integrations: [tailwind(), {
    name: 'production-discovery-files',
    hooks: { 'astro:build:done': ({ dir }) => {
      writeFileSync(new URL('robots.txt', dir), `User-agent: *
Allow: /

Sitemap: ${production.origin}/sitemap.xml
`);
      writeFileSync(new URL('sitemap.xml', dir), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map(path => `<url><loc>${production.origin}${path}</loc></url>`).join('')}</urlset>
`);
    } },
  }],
});
