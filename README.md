# Abdul Aziz Zailani - Engineering Blog & Personal Site

Repositori blog teknis, portofolio, dan dokumentasi arsitektur SRE publik [abdul-zailani.github.io](https://abdul-zailani.github.io/).

## 🛠️ Toolchain & Scripts

Repositori ini dilengkapi rantai perkakas deterministik untuk validasi konten dan pembangkit aset media sosial:

```bash
# 1. Kompilasi Tailwind CSS
npm run build:css

# 2. Validasi AST Sanitizer & Linter Konten (Zero-Token Quality Gate)
npm run lint:content

# 3. Kompilasi LinkedIn Slide Carousel (Marp CLI PDF Generator)
npm run build:slides
```

### Panduan Linter Vale (Opsional / Multi-Platform)
Untuk menjalankan audit gaya teks menggunakan Vale secara lokal:
- **macOS**: `brew install vale`
- **Linux**: `sudo snap install vale`
- **Jalankan**: `vale _posts/`

### Struktur Direktori Konten
- `_posts/`: Naskah artikel blog teknis dalam format Markdown Jekyll.
- `_slides/`: Draf slide carousel Marp (rasio aspek 4:5 untuk LinkedIn).
- `scripts/`: Skrip otomasi dan pemrosesan AST Markdown (`sanitize-content.mjs`).
- `styles/`: Aturan linter gaya teks dan *StopSlop* untuk Vale.
