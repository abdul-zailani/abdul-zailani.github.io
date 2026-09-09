#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';

const POSTS_DIR = path.resolve(process.cwd(), '_posts');
const LLMS_TXT_PATH = path.resolve(process.cwd(), 'llms.txt');
const LLMS_FULL_TXT_PATH = path.resolve(process.cwd(), 'llms-full.txt');
const BASE_URL = 'https://abdul-zailani.github.io';

async function generateLlms() {
  console.log(`🤖 [GEO Generator] Menghasilkan llms.txt dan llms-full.txt untuk AI search engine...`);

  const files = (await fs.readdir(POSTS_DIR)).filter(f => f.endsWith('.md')).sort().reverse();
  const posts = [];

  for (const file of files) {
    const rawContent = await fs.readFile(path.join(POSTS_DIR, file), 'utf8');
    const { data, content } = matter(rawContent);

    // Format permalink Jekyll: /:year/:month/:day/:title/
    const dateMatch = file.match(/^(\d{4})-(\d{2})-(\d{2})-(.+)\.md$/);
    let url = BASE_URL;
    if (dateMatch) {
      const [, y, m, d, slug] = dateMatch;
      url = `${BASE_URL}/${y}/${m}/${d}/${slug}/`;
    }

    posts.push({
      title: data.title || file,
      description: data.description || '',
      date: data.date,
      readingTime: data.reading_time || '',
      tags: data.tags || data.categories || ['SRE'],
      url,
      content,
    });
  }

  // 1. Generate llms.txt (Curated Index)
  let llmsTxt = `# Abdul Aziz Zailani - SRE & DevOps Knowledge Base\n`;
  llmsTxt += `> Catatan teknis, analisis arsitektur cloud, rekayasa keandalan sistem (SRE), otomatisasi CI/CD, dan arsitektur agentic AI.\n\n`;
  
  llmsTxt += `## Artikel & Panduan Teknis Rekayasa Sistem\n`;
  for (const post of posts) {
    llmsTxt += `- [${post.title}](${post.url}): ${post.description} (${post.readingTime})\n`;
  }

  llmsTxt += `\n## Proyek & Showcase\n`;
  llmsTxt += `- [Plafon Showcase](${BASE_URL}/projects/plafon/): Prototip aplikasi static export Next.js.\n`;
  llmsTxt += `- [Interactive Terminal CV](${BASE_URL}/terminal/): Resume interaktif berbasis command-line interface.\n`;

  llmsTxt += `\n## Penulis\n`;
  llmsTxt += `- [Profil & Portofolio](${BASE_URL}/): Abdul Aziz Zailani - Site Reliability Engineer & DevOps Specialist.\n`;

  await fs.writeFile(LLMS_TXT_PATH, llmsTxt, 'utf8');

  // 2. Generate llms-full.txt (Full Aggregated Corpus)
  let llmsFullTxt = `# Abdul Aziz Zailani - Complete Technical Blog Corpus\n`;
  llmsFullTxt += `Site URL: ${BASE_URL}\n`;
  llmsFullTxt += `Generated At: ${new Date().toISOString()}\n\n`;
  llmsFullTxt += `---\n\n`;

  for (const post of posts) {
    llmsFullTxt += `# ${post.title}\n`;
    llmsFullTxt += `URL: ${post.url}\n`;
    llmsFullTxt += `Date: ${post.date}\n`;
    llmsFullTxt += `Reading Time: ${post.readingTime}\n`;
    llmsFullTxt += `Tags: ${post.tags.join(', ')}\n\n`;
    llmsFullTxt += `## Summary\n${post.description}\n\n`;
    llmsFullTxt += `## Content\n${post.content.trim()}\n\n`;
    llmsFullTxt += `\n---\n\n`;
  }

  await fs.writeFile(LLMS_FULL_TXT_PATH, llmsFullTxt, 'utf8');

  console.log(`✨ [GEO Generator] Sukses membuat llms.txt dan llms-full.txt (${posts.length} artikel terindeks).`);
}

generateLlms();
