#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import readingTime from 'reading-time';

const POSTS_DIR = path.resolve(process.cwd(), '_posts');

const REQUIRED_FRONTMATTER = ['layout', 'title', 'date', 'description', 'reading_time', 'image'];
const FORBIDDEN_RAW_TAGS = [/\[!SUMMARY\]/i, /\[!NOTE\]/i, /\[!CAUTION\]/i, /\[!WARNING\]/i, /\[!IMPORTANT\]/i, /\[!TIP\]/i];
const FORBIDDEN_PLACEHOLDERS = [/\{\{title\}\}/i, /\{\{hook\}\}/i, /\{\{summary\}\}/i, /\{\{[^}]*\}\}/, /\[TODO\]/i, /\[TBD\]/i, /\[FILL ME\]/i];
const FORBIDDEN_INTERNAL_LABELS = [/\(GEO-Optimized\)/i, /Direct Answer:/i, /AI-Generated/i, /Claude Draft/i, /Prompt:/i];

// Patterns allowed in Jekyll liquid tags
const ALLOWED_LIQUID_PATTERN = /\{\{\s*['"]?[^'"]*['"]?\s*\|\s*(relative_url|absolute_url|url_encode|escape|date_to_xmlschema|date:[^}]+)\s*\}\}/;

async function validatePosts() {
  console.log(`🔍 [AST Sanitizer & Quality Linter] Memeriksa artikel di ${POSTS_DIR}...`);
  
  let files;
  try {
    files = (await fs.readdir(POSTS_DIR)).filter(f => f.endsWith('.md'));
  } catch (err) {
    console.error(`❌ Gagal membaca direktori ${POSTS_DIR}:`, err.message);
    process.exit(1);
  }

  let totalErrors = 0;
  let totalWords = 0;

  for (const file of files) {
    const filePath = path.join(POSTS_DIR, file);
    let content;
    try {
      content = await fs.readFile(filePath, 'utf8');
    } catch (err) {
      console.error(`❌ [${file}] Gagal membaca file:`, err.message);
      totalErrors++;
      continue;
    }

    let parsed;
    try {
      parsed = matter(content);
    } catch (err) {
      console.error(`❌ [${file}] YAML Frontmatter rusak:`, err.message);
      totalErrors++;
      continue;
    }

    // Hitung reading time akurat
    const stats = readingTime(parsed.content);
    totalWords += stats.words;

    // 1. Validasi Frontmatter
    for (const key of REQUIRED_FRONTMATTER) {
      if (!parsed.data[key]) {
        console.error(`❌ [${file}] Frontmatter kehilangan field wajib: '${key}'`);
        totalErrors++;
      }
    }

    // Validasi format reading_time
    if (parsed.data.reading_time) {
      const calculatedMin = Math.max(1, Math.ceil(stats.minutes));
      const expectedText = `${calculatedMin} min read`;
      // Verifikasi jika estimasi terlalu jauh berbeda (lebih dari selisih 3 menit)
      const currentMin = parseInt(parsed.data.reading_time);
      if (!isNaN(currentMin) && Math.abs(currentMin - calculatedMin) > 3) {
        console.warn(`  ⚠️ [${file}] Peringatan durasi baca: tercatat "${parsed.data.reading_time}", estimasi akurat "${expectedText}" (${stats.words} kata).`);
      }
    }

    const lines = parsed.content.split('\n');

    // 2. Validasi baris per baris
    lines.forEach((line, idx) => {
      const lineNum = idx + 1;

      // Cek Raw Callout Tags
      for (const pattern of FORBIDDEN_RAW_TAGS) {
        if (pattern.test(line)) {
          console.error(`❌ [${file}:${lineNum}] Tag callout mentah terdeteksi: "${line.trim()}"`);
          totalErrors++;
        }
      }

      // Cek Internal AI Labels
      for (const pattern of FORBIDDEN_INTERNAL_LABELS) {
        if (pattern.test(line)) {
          console.error(`❌ [${file}:${lineNum}] Label internal AI terdeteksi: "${line.trim()}"`);
          totalErrors++;
        }
      }

      // Cek Placeholders (kecuali Liquid tag yang diizinkan)
      for (const pattern of FORBIDDEN_PLACEHOLDERS) {
        if (pattern.test(line) && !ALLOWED_LIQUID_PATTERN.test(line)) {
          console.error(`❌ [${file}:${lineNum}] Placeholder template tertinggal: "${line.trim()}"`);
          totalErrors++;
        }
      }
    });
  }

  if (totalErrors > 0) {
    console.error(`\n❌ [AST Sanitizer] Ditemukan ${totalErrors} galat sanitasi konten. Perbaiki sebelum commit!`);
    process.exit(1);
  }

  const avgWords = Math.round(totalWords / files.length);
  console.log(`✅ [AST Sanitizer & Quality Linter] ${files.length} artikel tervalidasi bersih (Total ${totalWords.toLocaleString()} kata, rata-rata ${avgWords} kata/pos).`);
}

validatePosts();
