---
layout: post
title: "The Trap of In-House Auth: Mengapa Tim Engineering Terjebak Bikin SSO Sendiri (Catatan Kritis Senior SRE)"
date: 2026-08-21 16:30:00 +0700
categories: [engineering, architecture, sre]
tags: [sre, authentication, reliability, aws-cognito, security, sso, bff]
---

Sebagai Site Reliability Engineer (SRE), tugas utama kami adalah menjaga sistem tetap menyala (*resilient*), meminimalkan waktu henti (*downtime*), dan meredam kompleksitas operasional. Namun, dari sekian banyak insiden produksi dan *on-call paging* tengah malam yang pernah saya tangani, salah satu sumber kekacauan paling klasik berasal dari keputusan tim rekayasa yang nekat **membangun sistem autentikasi dan SSO sendiri dari nol (*in-house*)**.

Awalnya selalu dimulai dari perkiraan yang naif: *"Kita cuma butuh form login sederhana, tabel users, dan JWT token. Ngapain bayar vendor mahal atau pakai cloud IdP?"*

Tulisan ini adalah refleksi teknis dan operasional dari sudut pandang SRE: mengapa *in-house auth* adalah bom waktu keandalan (*reliability debt*), akar penyebab sistemik mengapa tim engineering sering terjebak, dan bagaimana pola **Headless Identity (BFF + Managed IdP)** menjadi jalan tengah terbaik untuk menjaga keandalan infrastruktur tanpa mengorbankan pengalaman pengguna (*UX*).

---

## 1. Realitas On-Call: "Gunung Es" Masalah Auth In-House

Bagi SRE, sistem login buatan sendiri bukanlah sekadar deretan kode `bcrypt` dan pembuatan token JWT. Di lingkungan produksi berskala besar, sistem auth in-house hampir selalu bermutasi menjadi *single point of failure* (SPOF) dengan beban operasional yang melelahkan:

### A. Dilema Token Revocation & Beban Redis Tak Terduga
JWT murni bersifat *stateless*. Saat ada akun karyawan yang dinonaktifkan secara mendesak atau terjadi indikasi kebocoran sesi, server tidak bisa membatalkan token tersebut sebelum masa kedaluwarsa (*TTL*) habis.

Solusi darurat tim pengembang biasanya adalah membuat *blacklist token* di Redis. Akibatnya:
* Sifat *stateless* hilang seketika. Setiap panggilan API kini bergantung pada latensi baca Redis.
* Jika kluster Redis mengalami *memory pressure* atau *network blip*, seluruh gerbang otorisasi API ikut tumbang (*cascading failure*).

### B. Serangan Bcrypt DoS (CPU Exhaustion 100%)
Algoritma hashing kata sandi seperti Bcrypt dan Argon2 sengaja dirancang rakus CPU (*work-factor based*) agar tahan terhadap serangan *brute force*. 

Namun, tanpa pembatasan laju (*rate limiting*) dan validasi panjang input yang ketat di lapisan paling depan, penyerang cukup mengirimkan muatan kata sandi berukuran 1MB secara paralel. Beban CPU pod Kubernetes langsung melonjak ke 100%, memicu *pod evictions*, dan melumpuhkan layanan mikro di sekitarnya.

### C. Beban Audit Kepatuhan (SOC 2 & ISO 27001)
Saat audit kepatuhan tahunan tiba, tim SRE yang harus membuktikan:
* Log audit yang anti-manipulasi (*tamper-proof*).
* Rotasi kunci enkripsi secara otomatis tanpa memutus sesi pengguna aktif.
* Mekanisme mitigasi serangan *credential stuffing* dan proteksi kebocoran data.

---

## 2. Akar Masalah Sistemik: Mengapa Tim Terus Mengulang Kesalahan Ini?

Keputusan membangun auth in-house jarang sekali didasari oleh niat buruk; ia lahir dari perpaduan bias kognitif, kekhawatiran finansial (*FinOps*), dan friksi arsitektur warisan (*legacy architecture*):

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 AKAR PENYEBAB SISTEMIK IN-HOUSE AUTH TRAP                   │
├──────────────────────┬──────────────────────┬───────────────────────────────┤
│  1. The 3-Day        │  2. The FinOps       │  3. The Monolith Anchor       │
│     Fallacy (NIH)    │     Paradox (MAU)    │     (SQL JOIN users)          │
├──────────────────────┼──────────────────────┼───────────────────────────────┤
│  4. Protocol vs App  │  5. Security Threat  │  6. Data Sovereignty &        │
│     Logic Blindspot  │     Model Gap        │     Air-Gapped Compliance     │
└──────────────────────┴──────────────────────┴───────────────────────────────┘
```

### 1. "The 3-Day Fallacy" & Not-Invented-Here (NIH) Syndrome
Developer sering mengira autentikasi hanyalah fungsi `POST /login -> verify password -> generate JWT`. Versi awal memang selesai dalam 3–5 hari sprint. 
Namun, auth adalah sistem dinamis yang terus membengkak: *password reset flows*, *account lockout*, *exponential backoff*, *TOTP/MFA synchronization*, *refresh token rotation with reuse detection* (RFC 6749), hingga *deprecation* algoritma hashing kuno.

### 2. Paradoks FinOps: Ketakutan Lonjakan Biaya MAU (Monthly Active Users)
Model penetapan harga SaaS IdP (seperti Auth0 atau Okta) berbasis MAU sering memicu *sticker shock*. Di skala 500k–1M+ pengguna aktif, tagihan tahunan bisa melonjak tajam ke puluhan ribu dolar.
Tim manajemen sering mengambil kalkulasi naif: *"Dengan biaya langganan segini, mending kita rekrut 1-2 engineer untuk bikin sistem auth internal."* 
Perhitungan ini mengabaikan Total Biaya Kepemilikan (*Total Cost of Ownership* / TCO): kluster database replika, lisensi KMS untuk *signing keys*, audit pentest pihak ketiga, serta beban *on-call* tim SRE saat auth down.

### 3. Inersia Basis Data Monolit (*The Relational Anchor*)
Pada aplikasi monolit warisan (*legacy monolith*), kolom `users.id` menjadi jangkar kunci asing (*foreign key*) ke ratusan tabel transaksi (`orders.user_id`, `payments.user_id`).
Query aplikasi dipenuhi dengan `JOIN users u ON u.id = o.user_id`. Mengadopsi managed IdP berarti memisahkan identitas autentikasi (`sub` UUID) dari data relasional bisnis—sebuah perubahan arsitektur besar yang memicu keengganan (*migration inertia*).

### 4. Menganggap Auth sebagai Logika Aplikasi, Bukan Protokol Identitas
Tim sering mencampuradukkan *Authentication* (siapa Anda) dengan *Authorization* (apa izin Anda). Protokol seperti OAuth 2.0, OpenID Connect (OIDC), dan SAML 2.0 adalah standar federasi yang sangat rumit. 
Saat klien enterprise meminta integrasi SSO, tim in-house sering membuat parser XML SAML darurat yang rentan terhadap *XML Signature Wrapping* (XSW) dan *XXE Injection*.

### 5. Kesenjangan Model Ancaman Keamanan (*Threat Model Gap*)
Sistem in-house kerap melewatkan kontrol krusial: perbandingan waktu konstan (*constant-time comparison*) untuk mencegah *timing attacks*, rotasi kunci asimetris publik via *JWKS endpoint* (`/.well-known/jwks.json`), serta mitigasi otomatis terhadap *credential stuffing* terdistribusi.

### 6. Kebutuhan Kedaulatan Data & Regulasi Air-Gapped
Pada industri perbankan dan infrastruktur kritis, regulasi residensi data melarang data kredensial keluar ke cloud SaaS pihak ketiga. Namun, respons yang tepat untuk kedaulatan data bukanlah menulis auth dari nol, melainkan mengadopsi platform identitas sumber terbuka teruji (*self-hosted IdP* seperti Keycloak atau Ory Kratos).

---

## 3. Solusi Arsitektur SRE: Pola Headless Identity (BFF + Managed IdP)

Untuk mencapai keandalan empat sembilan (*99.99% availability*) tanpa mengorbankan kontrol antarmuka dan kepatuhan data, pisahkan tanggung jawab secara tegas:

```
┌──────────────────────────────────────────────┐
│       Frontend (Next.js / Web Console)       │ ◄── 100% Custom Native UI, Theme, OTP Slots
└──────────────────────┬───────────────────────┘
                       │ POST /auth/login (Internal API via Cookie)
                       ▼
┌──────────────────────────────────────────────┐
│        BFF Layer (Go / Node Backend)         │ ◄── GCRA Rate Limiter, Zero-Leak Log, AES-256 Encrypt
└──────────────────────┬───────────────────────┘
                       │ Direct Auth API (USER_PASSWORD_AUTH / SRP)
                       ▼
┌──────────────────────────────────────────────┐
│       Managed IdP (AWS Cognito / Auth0)      │ ◄── Brankas Identitas, TOTP Engine, SOC 2 Tier
└──────────────────────────────────────────────┘
```

### Rincian Pembagian Beban Kerja:
1. **Frontend (Bespoke UI)**: Mengembangkan form login native di Next.js/React. Desain slot kode TOTP 6-digit dengan *auto-submit* (debounce 100ms), hitung mundur masa sesi, dan status tema gelap/terang tanpa ada pengalihan halaman (*zero visual flicker*).
2. **BFF Layer (Go Backend)**: Menerima kredensial dari frontend, menerapkan pembatasan laju permintaan berbasis Redis (dengan cadangan *in-memory fallback* saat Redis bermasalah), meneruskan permintaan ke API Cognito, lalu membungkus token ke dalam cookie terenkripsi `HttpOnly`, `Secure`, dan `SameSite`.
3. **Managed IdP (AWS Cognito)**: Bertindak sebagai otoritas identitas tunggal yang menangani verifikasi kata sandi, validasi MFA, rotasi kunci kriptografi, dan kepatuhan regulasi.

---

## 4. Validasi Standar Keamanan: IETF RFC 9700 & OWASP

Pola **Headless Auth + BFF Proxy** ini bukan sekadar preferensi pribadi SRE, melainkan standar baku yang ditetapkan oleh konsorsium keamanan internet global:

* **IETF OAuth 2.0 for Browser-Based Apps (RFC 9700 / BCP)**:
  Browser diklasifikasikan sebagai *Public Client* yang tidak aman untuk menyimpan token otorisasi. IETF secara eksplisit merekomendasikan **BFF Proxy Pattern**: browser tidak boleh memegang token akses mentah di JavaScript, melainkan hanya memegang pengenal sesi terenkripsi sisi server.
* **OWASP Token Storage Standard**:
  Menyimpan JWT di `localStorage` atau `sessionStorage` adalah celah fatal terhadap serangan *Cross-Site Scripting (XSS)*. Cookie `HttpOnly` yang dikelola oleh lapisan backend BFF adalah metode pertahanan paling solid.

---

## 5. Studi Kasus Nyata di Lapangan

### Skenario 1: Internal Developer Platform & SRE Operations Console *(Studi Kasus: Plafon)*
* **Masalah**: Pengalihan Hosted UI Cognito membuat engineer terpental keluar ke domain luar (`sso.thelionparcel.com`) saat sedang melakukan mitigasi insiden darurat, serta kerap bermasalah di jaringan privat (VPN/IAP).
* **Solusi**: Form login disatukan langsung ke dalam dashboard Plafon. BFF Go memanggil `InitiateAuth` ke AWS Cognito via API internal, memvalidasi TOTP Authenticator 6-digit, dan memetakan hak akses grup langsung ke RBAC Kubernetes tanpa membocorkan kredensial ke peramban.

### Skenario 2: Layanan FinTech & Transaksi E-Commerce
* **Masalah**: Pengalihan halaman ke domain pihak ketiga saat checkout memicu keraguan psikologis pengguna (*trust gap*). Riset industri membuktikan setiap pengalihan halaman tambahan menurunkan rasio konversi (*conversion rate*) sebesar **10–15%**.
* **Solusi**: Alur login dan checkout terintegrasi mulus di dalam modal transaksi (*frictionless in-app experience*). Keamanan transaksi memenuhi standar PCI-DSS dan SOC 2 karena pemrosesan identitas didelegasikan ke infrastruktur cloud hyperscaler.

### Skenario 3: Multi-Tenant B2B SaaS Enterprise
* **Masalah**: Pelanggan korporat menuntut integrasi Single Sign-On (SAML 2.0 / Okta) dengan portal login berlabel merek mereka sendiri (*white-label*). Mengembangkan parser XML SAML in-house sangat rentan terhadap eksploitasi *XML Signature Wrapping (XSW)*.
* **Solusi**: Form input mendeteksi ranah domain email pengguna (*Home Realm Discovery*), lalu BFF merutekan otentikasi ke jabat tangan SAML enterprise atau Cognito User Pool secara otomatis di latar belakang.

---

## 6. Prinsip Utama Senior SRE

Bagi para engineer dan pimpinan teknologi yang sedang merancang arsitektur sistem, pegang satu prinsip fundamental ini:

> **"Buy for parity, build for competitive advantage."**

Kecuali model bisnis inti perusahaan Anda adalah menjual produk keamanan siber, mengorbankan waktu dan keandalan sistem untuk membangun ulang brankas kata sandi adalah bentuk *technical debt* yang tidak perlu. 

Gunakan pola arsitektur **Headless Identity**: berikan antarmuka kelas satu yang elegan bagi pengguna, sambil memastikan infrastruktur autentikasi Anda tetap kokoh, aman, dan dapat diandalkan sepanjang waktu.

---

## Referensi
* [IETF RFC 9700 / BCP: OAuth 2.0 for Browser-Based Apps](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-browser-based-apps)
* [OWASP Authentication & Token Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
* [AWS Cognito Developer Guide: Direct Authentication API](https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-authentication-flow.html)
* [IBM Security: Cost of a Data Breach Report](https://www.ibm.com/reports/data-breach)
