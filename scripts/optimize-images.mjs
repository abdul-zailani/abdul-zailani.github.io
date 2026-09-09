#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { glob } from 'glob';

const IMAGES_DIR = path.resolve(process.cwd(), 'assets/images');

async function optimizeImages() {
  console.log(`🖼️ [Image Optimizer] Memindai berkas gambar di ${IMAGES_DIR}...`);

  try {
    await fs.access(IMAGES_DIR);
  } catch {
    console.warn(`⚠️ Direktori ${IMAGES_DIR} tidak ditemukan.`);
    return;
  }

  const files = await glob('assets/images/**/*.{png,jpg,jpeg}', { posix: true });

  if (files.length === 0) {
    console.log('ℹ️ Tidak ada gambar (PNG/JPG) yang perlu dioptimasi.');
    return;
  }

  let totalOriginal = 0;
  let totalOptimized = 0;
  let convertedCount = 0;

  for (const file of files) {
    const ext = path.extname(file);
    const outWebp = file.slice(0, -ext.length) + '.webp';

    try {
      const srcStat = await fs.stat(file);
      totalOriginal += srcStat.size;

      let needRebuild = true;
      try {
        const destStat = await fs.stat(outWebp);
        if (destStat.mtimeMs >= srcStat.mtimeMs) {
          needRebuild = false;
          totalOptimized += destStat.size;
        }
      } catch {
        needRebuild = true;
      }

      if (needRebuild) {
        await sharp(file)
          .webp({ quality: 80, effort: 5 })
          .toFile(outWebp);

        const newStat = await fs.stat(outWebp);
        totalOptimized += newStat.size;
        convertedCount++;

        const savedPct = (((srcStat.size - newStat.size) / srcStat.size) * 100).toFixed(1);
        console.log(`  ✓ [WebP] ${path.basename(file)} -> ${path.basename(outWebp)} (${(srcStat.size / 1024).toFixed(1)} KB -> ${(newStat.size / 1024).toFixed(1)} KB, -${savedPct}%)`);
      }
    } catch (err) {
      console.error(`❌ Gagal mengoptimasi ${file}:`, err.message);
    }
  }

  const totalSavedKB = ((totalOriginal - totalOptimized) / 1024).toFixed(1);
  const totalSavedPct = totalOriginal > 0 ? (((totalOriginal - totalOptimized) / totalOriginal) * 100).toFixed(1) : 0;

  console.log(`✨ [Image Optimizer] Selesai! ${convertedCount} gambar baru dikonversi. Total hemat: ${totalSavedKB} KB (-${totalSavedPct}%).`);
}

optimizeImages();
