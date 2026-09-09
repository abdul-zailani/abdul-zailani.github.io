#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import readingTime from 'reading-time';

const POSTS_DIR = path.resolve(process.cwd(), '_posts');
const IMAGES_DIR = path.resolve(process.cwd(), 'assets/images');

async function optimizePosts() {
  console.log(`🚀 [Post Content Optimizer] Mengoptimasi metadata & aset di ${POSTS_DIR}...`);

  let files;
  try {
    files = (await fs.readdir(POSTS_DIR)).filter(f => f.endsWith('.md'));
  } catch (err) {
    console.error(`❌ Gagal membaca direktori ${POSTS_DIR}:`, err.message);
    process.exit(1);
  }

  let updatedCount = 0;

  for (const file of files) {
    const filePath = path.join(POSTS_DIR, file);
    let rawContent = await fs.readFile(filePath, 'utf8');
    let parsed = matter(rawContent);
    let modified = false;

    // 1. Sync reading_time automatically
    const stats = readingTime(parsed.content);
    const calculatedMinutes = Math.max(1, Math.ceil(stats.minutes));
    const newReadingTime = `${calculatedMinutes} min read`;

    if (parsed.data.reading_time !== newReadingTime) {
      parsed.data.reading_time = newReadingTime;
      modified = true;
    }

    // 2. Cek image header/frontmatter jika ada versi .webp
    if (parsed.data.image && typeof parsed.data.image === 'string') {
      const imgPath = parsed.data.image;
      if (imgPath.match(/\.(png|jpg|jpeg)$/i)) {
        const webpPath = imgPath.replace(/\.(png|jpg|jpeg)$/i, '.webp');
        const localWebpFile = path.join(process.cwd(), webpPath.replace(/^\//, ''));
        try {
          await fs.access(localWebpFile);
          // Berkas WebP tersedia
          if (parsed.data.image !== webpPath) {
            parsed.data.image = webpPath;
            modified = true;
          }
        } catch {
          // File webp belum dibuat, pertahankan file asli
        }
      }
    }

    if (modified) {
      const newFileContent = matter.stringify(parsed.content, parsed.data);
      await fs.writeFile(filePath, newFileContent, 'utf8');
      console.log(`  ✓ [Updated] ${file} (reading_time: ${newReadingTime}, image: ${parsed.data.image || '-'})`);
      updatedCount++;
    }
  }

  console.log(`✨ [Post Content Optimizer] Selesai! ${updatedCount} artikel disinkronkan.`);
}

optimizePosts();
