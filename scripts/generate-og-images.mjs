#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import matter from 'gray-matter';

const POSTS_DIR = path.resolve(process.cwd(), '_posts');
const OUTPUT_DIR = path.resolve(process.cwd(), 'assets/images/og');

async function loadFonts() {
  // Gunakan font KaTeX SansSerif yang sudah terinstal di node_modules sebagai fallback luring (offline)
  const regularFontPath = path.resolve(process.cwd(), 'node_modules/katex/dist/fonts/KaTeX_SansSerif-Regular.ttf');
  const boldFontPath = path.resolve(process.cwd(), 'node_modules/katex/dist/fonts/KaTeX_SansSerif-Bold.ttf');

  const regularFont = await fs.readFile(regularFontPath);
  const boldFont = await fs.readFile(boldFontPath);

  return [
    {
      name: 'KaTeX Sans',
      data: regularFont,
      weight: 400,
      style: 'normal',
    },
    {
      name: 'KaTeX Sans',
      data: boldFont,
      weight: 700,
      style: 'normal',
    },
  ];
}

async function generateOgImages() {
  console.log(`🎨 [OG Image Generator] Membuat kartu Open Graph 1200x630 di ${OUTPUT_DIR}...`);
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const fonts = await loadFonts();
  const files = (await fs.readdir(POSTS_DIR)).filter(f => f.endsWith('.md'));

  let generatedCount = 0;

  for (const file of files) {
    const slug = file.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/, '');
    const outPath = path.join(OUTPUT_DIR, `${slug}.png`);

    const rawContent = await fs.readFile(path.join(POSTS_DIR, file), 'utf8');
    const { data } = matter(rawContent);

    const title = data.title || slug;
    const desc = data.description || '';
    const readingTime = data.reading_time || '5 min read';
    const tag = (data.tags && data.tags[0]) || (data.categories && data.categories[0]) || 'SRE & DevOps';

    // Desain VNode Satori (1200x630)
    const element = {
      type: 'div',
      props: {
        style: {
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#0B0F19',
          backgroundImage: 'radial-gradient(circle at 90% 10%, rgba(56, 189, 248, 0.18) 0%, rgba(11, 15, 25, 0) 50%), radial-gradient(circle at 10% 90%, rgba(99, 102, 241, 0.15) 0%, rgba(11, 15, 25, 0) 50%)',
          padding: '60px 70px',
          fontFamily: 'KaTeX Sans',
        },
        children: [
          // Top Brand Bar
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
              },
              children: [
                {
                  type: 'div',
                  props: {
                    style: {
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    },
                    children: [
                      {
                        type: 'div',
                        props: {
                          style: {
                            width: '14px',
                            height: '14px',
                            borderRadius: '50%',
                            backgroundColor: '#38BDF8',
                          },
                        },
                      },
                      {
                        type: 'span',
                        props: {
                          style: {
                            color: '#94A3B8',
                            fontSize: '22px',
                            fontWeight: 700,
                            letterSpacing: '2px',
                            textTransform: 'uppercase',
                          },
                          children: 'Abdul Aziz Zailani',
                        },
                      },
                    ],
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: {
                      backgroundColor: 'rgba(56, 189, 248, 0.12)',
                      border: '1px solid rgba(56, 189, 248, 0.4)',
                      borderRadius: '8px',
                      padding: '6px 16px',
                      color: '#38BDF8',
                      fontSize: '18px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                    },
                    children: tag,
                  },
                },
              ],
            },
          },

          // Center Content (Title & Description)
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                marginTop: '30px',
                marginBottom: '30px',
              },
              children: [
                {
                  type: 'h1',
                  props: {
                    style: {
                      color: '#F8FAFC',
                      fontSize: title.length > 55 ? '46px' : '54px',
                      fontWeight: 700,
                      lineHeight: 1.25,
                      margin: 0,
                    },
                    children: title,
                  },
                },
                desc ? {
                  type: 'p',
                  props: {
                    style: {
                      color: '#94A3B8',
                      fontSize: '24px',
                      lineHeight: 1.4,
                      margin: 0,
                    },
                    children: desc.length > 120 ? desc.substring(0, 117) + '...' : desc,
                  },
                } : null,
              ].filter(Boolean),
            },
          },

          // Bottom Footer Meta
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTop: '1px solid rgba(51, 65, 85, 0.8)',
                paddingTop: '25px',
                width: '100%',
              },
              children: [
                {
                  type: 'div',
                  props: {
                    style: {
                      color: '#64748B',
                      fontSize: '20px',
                      fontWeight: 400,
                    },
                    children: `⏱️ ${readingTime}  •  abdul-zailani.github.io`,
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: {
                      color: '#818CF8',
                      fontSize: '20px',
                      fontWeight: 700,
                    },
                    children: 'Site Reliability Engineering',
                  },
                },
              ],
            },
          },
        ],
      },
    };

    try {
      const svg = await satori(element, {
        width: 1200,
        height: 630,
        fonts,
      });

      const resvg = new Resvg(svg, {
        fitTo: {
          mode: 'width',
          value: 1200,
        },
      });
      const pngData = resvg.render();
      const pngBuffer = pngData.asPng();

      await fs.writeFile(outPath, pngBuffer);
      generatedCount++;
    } catch (err) {
      console.error(`❌ Gagal generate OG image untuk ${slug}:`, err.message);
    }
  }

  console.log(`✨ [OG Image Generator] Sukses menghasilkan ${generatedCount} kartu Open Graph PNG di ${OUTPUT_DIR}.`);
}

generateOgImages();
