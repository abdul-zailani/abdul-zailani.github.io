#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';

const POSTS_DIR = path.resolve(process.cwd(), '_posts');

const REQUIRED_FRONTMATTER = ['layout', 'title', 'date', 'description', 'reading_time', 'image'];
const FORBIDDEN_RAW_TAGS = [/\[!SUMMARY\]/i, /\[!NOTE\]/i, /\[!CAUTION\]/i, /\[!WARNING\]/i, /\[!IMPORTANT\]/i, /\[!TIP\]/i];
const FORBIDDEN_PLACEHOLDERS = [/\{\{title\}\}/i, /\{\{hook\}\}/i, /\{\{summary\}\}/i, /\{\{[^}]*\}\}/, /\[TODO\]/i, /\[TBD\]/i, /\[FILL ME\]/i];
const FORBIDDEN_INTERNAL_LABELS = [/\(GEO-Optimized\)/i, /Direct Answer:/i, /AI-Generated/i, /Claude Draft/i, /Prompt:/i];

// Patterns allowed in Jekyll liquid tags
const ALLOWED_LIQUID_PATTERN = /\{\{\s*['"]?[^'"]*['"]?\s*\|\s*(relative_url|absolute_url|url_encode|escape|date_to_xmlschema|date:[^}]+)\s*\}\}/;

async function validatePosts() {
  console.log(`🔍 [AST Sanitizer] Memeriksa berkas artikel di ${POSTS_DIR}...`);
  
  let files;
  try {
    files = (await fs.readdir(POSTS_DIR)).filter(f => f.endsWith('.md'));
  } catch (err) {
    console.error(`❌ Gagal membaca direktori ${POSTS_DIR}:`, err.message);
    process.exit(1);
  }

  let totalErrors = 0;

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

    // 1. Validasi Frontmatter
    for (const key of REQUIRED_FRONTMATTER) {
      if (!parsed.data[key]) {
        console.error(`❌ [${file}] Frontmatter kehilangan field wajib: '${key}'`);
        totalErrors++;
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

  console.log(`✅ [AST Sanitizer] Seluruh artikel (${files.length} berkas) tervalidasi bersih. 0 galat sanitasi.`);
}

validatePosts();
