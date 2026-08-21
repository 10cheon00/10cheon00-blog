import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';

const site = process.env.SITE_URL ?? 'https://10choen00.xyz';

export default defineConfig({
  site,
  integrations: [sitemap()],
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
    shikiConfig: {
      theme: 'github-dark',
      wrap: true
    }
  }
});
