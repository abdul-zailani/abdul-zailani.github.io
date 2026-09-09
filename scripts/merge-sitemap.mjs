#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { glob } from 'glob';

const SITE_DIR = path.resolve(process.cwd(), '_site');
const SITEMAP_PATH = path.join(SITE_DIR, 'sitemap.xml');
const BASE_URL = 'https://abdul-zailani.github.io';

async function mergeSitemap() {
  console.log(`🗺️ [Sitemap Merger] Memindai berkas output HTML di ${SITE_DIR}...`);

  try {
    await fs.access(SITE_DIR);
  } catch {
    console.warn(`⚠️ Direktori ${SITE_DIR} belum tersedia. Jalankan build terlebih dahulu.`);
    return;
  }

  const files = await glob('**/*.html', { cwd: SITE_DIR, posix: true });
  const urls = [];

  for (const file of files) {
    // Abaikan 404, error pages, google verification
    if (file === '404.html' || file.startsWith('google') || file.includes('private')) {
      continue;
    }

    const filePath = path.join(SITE_DIR, file);
    const stat = await fs.stat(filePath);
    const lastmod = new Date(stat.mtime).toISOString().split('T')[0];

    let urlPath = '/' + file.replace(/index\.html$/, '');
    if (!urlPath.endsWith('/') && !urlPath.includes('.')) {
      urlPath += '/';
    }

    let priority = '0.7';
    let changefreq = 'monthly';

    if (urlPath === '/') {
      priority = '1.0';
      changefreq = 'weekly';
    } else if (urlPath === '/blog/' || urlPath === '/projects/') {
      priority = '0.9';
      changefreq = 'weekly';
    } else if (urlPath.startsWith('/2026/')) {
      priority = '0.8';
      changefreq = 'monthly';
    }

    urls.push({
      loc: `${BASE_URL}${urlPath}`,
      lastmod,
      changefreq,
      priority,
    });
  }

  // Deduplikasi URL
  const uniqueUrls = Array.from(new Map(urls.map(u => [u.loc, u])).values());

  // Bangun XML Sitemap
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  for (const u of uniqueUrls) {
    xml += `  <url>\n`;
    xml += `    <loc>${u.loc}</loc>\n`;
    xml += `    <lastmod>${u.lastmod}</lastmod>\n`;
    xml += `    <changefreq>${u.changefreq}</changefreq>\n`;
    xml += `    <priority>${u.priority}</priority>\n`;
    xml += `  </url>\n`;
  }

  xml += `</urlset>\n`;

  await fs.writeFile(SITEMAP_PATH, xml, 'utf8');
  console.log(`✨ [Sitemap Merger] Sukses membuat sitemap.xml komprehensif (${uniqueUrls.length} tautan terindeks di ${SITEMAP_PATH}).`);
}

mergeSitemap();
