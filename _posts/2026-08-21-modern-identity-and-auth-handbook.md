---
layout: post
title: "The SRE & Engineering Leader's Handbook: Modern Identity & Authentication Architecture"
date: 2026-08-21 16:45:00 +0700
categories: [engineering, architecture, sre, security]
tags: [handbook, sre, authentication, security, aws-cognito, bff, identity-fabric, ietf, owasp]
---

Autentikasi dan Single Sign-On (SSO) adalah salah satu komponen infrastruktur paling krusial sekaligus sering disalahpahami dalam rekayasa perangkat lunak modern. Di satu sisi, ia adalah gerbang utama menuju seluruh layanan bisnis (*single point of failure*). Di sisi lain, ia adalah sumber utama utang teknis (*technical debt*), beban operasional *on-call*, dan celah keamanan (*security liabilities*).

Buku panduan (*handbook*) ini disusun dari kacamata **Site Reliability Engineering (SRE) dan Kepemimpinan Rekayasa (*Engineering Leadership*)**. Tujuannya adalah memberikan panduan komprehensif, mulai dari data lanskap industri, bedah akar masalah sistemik, standar arsitektur **Headless Identity (BFF + Managed IdP)**, mitigasi kegagalan produksi (*failure modes runbook*), hingga strategi migrasi bertahap dari monolit warisan (*legacy migration playbook*).

---

## 📑 Daftar Isi (Table of Contents)
1. [Chapter 1: Lanskap Industri: Data Nyata & Paradoks Adopsi](#chapter-1-lanskap-industri-data-nyata--paradoks-adopsi)
2. [Chapter 2: The In-House Trap: 6 Akar Masalah Sistemik](#chapter-2-the-in-house-trap-6-akar-masalah-sistemik)
3. [Chapter 3: Standar Arsitektur: Pola Headless Identity (BFF Proxy)](#chapter-3-standar-arsitektur-pola-headless-identity-bff-proxy)
4. [Chapter 4: SRE Runbook: Kegagalan Produksi & Mitigasi Kritis](#chapter-4-sre-runbook-kegagalan-produksi--mitigasi-kritis)
5. [Chapter 5: Migration Playbook: Menembus 'Relational Monolith' Tanpa Downtime](#chapter-5-migration-playbook-menembus-relational-monolith-tanpa-downtime)
6. [Chapter 6: Matriks Pengambilan Keputusan (Decision Matrix)](#chapter-6-matriks-pengambilan-keputusan-decision-matrix)

---

## Chapter 1: Lanskap Industri: Data Nyata & Paradoks Adopsi

Banyak tim pemula berasumsi: *"Perusahaan besar banyak yang bikin auth sendiri, berarti kita juga harus bikin sendiri."* Mari kita bedah data industri nyata:

| Segmen Perusahaan | Status Arsitektur Dominan | Realitas Operasional |
| :--- | :--- | :--- |
| Greenfield / Startups<br><span style="font-size: 0.8rem; color: var(--on-surface-variant, #6b6b6b); font-weight: normal;">(2024–2026)</span> | <code style="color: #2b6e30; background: rgba(43,110,48,0.1); padding: 2px 6px; border-radius: 4px;">&gt;85% Managed IdP</code><br><span style="font-size: 0.85rem; color: var(--on-surface-variant, #6b6b6b);">Zero in-house password DB</span> | Memilih *"Buy"* (Clerk, Supabase, Cognito) demi time-to-market cepat dan fokus bisnis inti. |
| Mid-Market & SaaS<br><span style="font-size: 0.8rem; color: var(--on-surface-variant, #6b6b6b); font-weight: normal;">($2M – $50M ARR)</span> | <code style="color: #2b6e30; background: rgba(43,110,48,0.1); padding: 2px 6px; border-radius: 4px;">72% – 83% Managed IdP</code><br><span style="font-size: 0.85rem; color: var(--on-surface-variant, #6b6b6b);">Cognito, Auth0, WorkOS</span> | Migrasi cepat untuk lolos audit SOC 2 Type II, integrasi SAML B2B, dan memangkas TCO. |
| Traditional Enterprise<br><span style="font-size: 0.8rem; color: var(--on-surface-variant, #6b6b6b); font-weight: normal;">(Bank, Telco, BUMN)</span> | <code style="color: #a61c14; background: rgba(166,28,20,0.1); padding: 2px 6px; border-radius: 4px;">&gt;55% In-House / Legacy WAM</code><br><span style="font-size: 0.85rem; color: var(--on-surface-variant, #6b6b6b);">SiteMinder, DB Monolith</span> | <strong style="color: #b25e00;">82% mengeluh dampak negatif bisnis</strong> (Descope Report), terjebak utang relasional. |
| Big Tech Hyperscalers<br><span style="font-size: 0.8rem; color: var(--on-surface-variant, #6b6b6b); font-weight: normal;">(Google, Netflix, Uber)</span> | <code style="color: var(--primary, #000000); background: rgba(0,0,0,0.05); padding: 2px 6px; border-radius: 4px;">In-House Dedicated Platform</code><br><span style="font-size: 0.85rem; color: var(--on-surface-variant, #6b6b6b);">Gaia, Passport, SPIFFE</span> | Punya 1 divisi khusus (50+ SRE & Kriptografer); biaya R&D teramortisasi ke ribuan layanan. |

### Paradoks Warisan (*The Legacy Paradox*)
Mayoritas perusahaan lama yang masih menjalankan *in-house auth* bertahan **bukan karena itu adalah praktik arsitektur terbaik**, melainkan karena **mereka terperangkap dalam utang teknis masa lalu (*legacy inertia*)**. Menurut survei *Descope CIAM Report* terhadap 416 pengambil keputusan:
* **82% perusahaan** mengalami dampak negatif bisnis akibat auth lama mereka.
* **52% anggaran operasional** terbuang untuk tiket bantuan (*support tickets*) seputar login dan reset kata sandi.
* Dari 51% perusahaan yang memakai sistem auth internal lama, **hanya 8% yang sudi membangunnya lagi secara in-house jika memulai dari nol hari ini.**

---

## Chapter 2: The In-House Trap: 6 Akar Masalah Sistemik

Keputusan membangun sistem auth dari nol sering kali dipicu oleh kombinasi bias kognitif dan friksi arsitektur:

<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; margin: 1.5rem 0;">
  <div style="background: var(--surface-container-low, #f4f3f2); border: 1px solid var(--outline, #e5e5e5); border-radius: 8px; padding: 1.2rem;">
    <div style="color: #a61c14; font-weight: bold; font-size: 1rem; margin-bottom: 0.5rem;">1. The 3-Day Fallacy (NIH)</div>
    <div style="color: var(--on-surface-variant, #6b6b6b); font-size: 0.88rem; line-height: 1.5;">Ilusi awal bahwa auth cuma <code>bcrypt + JWT</code> dalam 1 sprint. Berubah jadi mimpi buruk pemeliharaan saat fitur reset password, lockout, dan MFA drift diminta.</div>
  </div>
  <div style="background: var(--surface-container-low, #f4f3f2); border: 1px solid var(--outline, #e5e5e5); border-radius: 8px; padding: 1.2rem;">
    <div style="color: #b25e00; font-weight: bold; font-size: 1rem; margin-bottom: 0.5rem;">2. FinOps Paradox (MAU)</div>
    <div style="color: var(--on-surface-variant, #6b6b6b); font-size: 0.88rem; line-height: 1.5;">Ketakutan biaya MAU Auth0/Okta memicu ilusi bikin sendiri, padahal mengabaikan TCO replika DB, KMS signing, audit pentest, dan biaya on-call SRE.</div>
  </div>
  <div style="background: var(--surface-container-low, #f4f3f2); border: 1px solid var(--outline, #e5e5e5); border-radius: 8px; padding: 1.2rem;">
    <div style="color: #7a1ca6; font-weight: bold; font-size: 1rem; margin-bottom: 0.5rem;">3. The Monolith Anchor</div>
    <div style="color: var(--on-surface-variant, #6b6b6b); font-size: 0.88rem; line-height: 1.5;">Keterikatan relasional di mana <code>users.id</code> menjadi Foreign Key ke ratusan tabel transaksi (<code>JOIN users</code>), memicu inersia migrasi yang besar.</div>
  </div>
  <div style="background: var(--surface-container-low, #f4f3f2); border: 1px solid var(--outline, #e5e5e5); border-radius: 8px; padding: 1.2rem;">
    <div style="color: #165ba6; font-weight: bold; font-size: 1rem; margin-bottom: 0.5rem;">4. Protocol vs App Logic</div>
    <div style="color: var(--on-surface-variant, #6b6b6b); font-size: 0.88rem; line-height: 1.5;">Mencampuradukkan AuthN dengan AuthZ, serta parser XML SAML darurat in-house yang rentan terhadap celah XML Signature Wrapping (XSW).</div>
  </div>
  <div style="background: var(--surface-container-low, #f4f3f2); border: 1px solid var(--outline, #e5e5e5); border-radius: 8px; padding: 1.2rem;">
    <div style="color: #2b6e30; font-weight: bold; font-size: 1rem; margin-bottom: 0.5rem;">5. Security Threat Model Gap</div>
    <div style="color: var(--on-surface-variant, #6b6b6b); font-size: 0.88rem; line-height: 1.5;">Absennya kontrol kriptografi kritis: constant-time comparison (timing attack), rotasi asimetris JWKS, dan mitigasi credential stuffing terdistribusi.</div>
  </div>
  <div style="background: var(--surface-container-low, #f4f3f2); border: 1px solid var(--outline, #e5e5e5); border-radius: 8px; padding: 1.2rem;">
    <div style="color: #0e627a; font-weight: bold; font-size: 1rem; margin-bottom: 0.5rem;">6. Data Sovereignty / Air-Gap</div>
    <div style="color: var(--on-surface-variant, #6b6b6b); font-size: 0.88rem; line-height: 1.5;">Regulasi residensi data direspons keliru dengan menulis auth dari nol, alih-alih mengadopsi self-hosted IdP open-source (Keycloak/Ory).</div>
  </div>
</div>

---

## Chapter 3: Standar Arsitektur: Pola Headless Identity (BFF Proxy)

Untuk memutus dilema antara *"kebebasan desain UI"* dan *"keamanan brankas identitas"*, industri merekomendasikan pola **Headless Identity dengan Backend-for-Frontend (BFF)**.

<div style="background: var(--surface-container-low, #f4f3f2); border: 1px solid var(--outline, #e5e5e5); border-radius: 8px; padding: 1.5rem; margin: 1.5rem 0; font-family: monospace;">
  <!-- Frontend Layer -->
  <div style="background: var(--surface-container-lowest, #ffffff); border: 1px solid #165ba6; border-radius: 6px; padding: 1rem; margin-bottom: 0.8rem;">
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
      <span style="color: #165ba6; font-weight: bold;">🖥️ Frontend (Next.js / Web Console)</span>
      <span style="color: #2b6e30; font-size: 0.85rem; background: rgba(43,110,48,0.1); padding: 2px 8px; border-radius: 4px;">100% Custom Native UI, Theme, OTP Slots</span>
    </div>
  </div>
  
  <!-- Flow 1 -->
  <div style="text-align: center; color: var(--on-surface-variant, #6b6b6b); font-size: 0.85rem; margin: 0.4rem 0;">
    │ &nbsp; <span style="color: #165ba6;">POST /auth/login</span> (Internal API via Secure HttpOnly Cookie)
    <br>▼
  </div>

  <!-- BFF Layer -->
  <div style="background: var(--surface-container-lowest, #ffffff); border: 1px solid #7a1ca6; border-radius: 6px; padding: 1rem; margin: 0.8rem 0;">
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
      <span style="color: #7a1ca6; font-weight: bold;">⚙️ BFF Layer (Go / Node Backend)</span>
      <span style="color: #b25e00; font-size: 0.85rem; background: rgba(178,94,0,0.1); padding: 2px 8px; border-radius: 4px;">GCRA Rate Limiter, Zero-Leak Log, AES-256 Session Encrypt</span>
    </div>
  </div>

  <!-- Flow 2 -->
  <div style="text-align: center; color: var(--on-surface-variant, #6b6b6b); font-size: 0.85rem; margin: 0.4rem 0;">
    │ &nbsp; <span style="color: #2b6e30;">Direct Auth API</span> (USER_PASSWORD_AUTH / USER_SRP_AUTH)
    <br>▼
  </div>

  <!-- Managed IdP Layer -->
  <div style="background: var(--surface-container-lowest, #ffffff); border: 1px solid #2b6e30; border-radius: 6px; padding: 1rem; margin-top: 0.8rem;">
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
      <span style="color: #2b6e30; font-weight: bold;">🛡️ Managed IdP (AWS Cognito / Auth0)</span>
      <span style="color: #165ba6; font-size: 0.85rem; background: rgba(22,91,166,0.1); padding: 2px 8px; border-radius: 4px;">Brankas Identitas, TOTP Engine, SOC 2 / ISO Tier</span>
    </div>
  </div>
</div>

### Validasi Standar Global:
1. **IETF OAuth 2.0 for Browser-Based Apps (RFC 9700 / BCP)**:
   Browser diklasifikasikan sebagai *Public Client* yang tidak aman. IETF menetapkan **BFF Proxy Pattern**: browser tidak pernah memegang token JWT mentah di JavaScript, melainkan hanya menyimpan *session identifier* terenkripsi sisi server.
2. **OWASP Token Storage Standard**:
   Melarang keras penyimpanan JWT di `localStorage` atau `sessionStorage` (target empuk serangan XSS). Seluruh token sensitif wajib dibungkus dalam cookie dengan atribut `HttpOnly`, `Secure`, dan `SameSite=Strict/Lax`.

---

## Chapter 4: SRE Runbook: Kegagalan Produksi & Mitigasi Kritis

Bagi engineer on-call, berikut adalah matriks penanganan insiden autentikasi yang paling sering terjadi di produksi:

| Vektor Kegagalan / Insiden | Dampak Sistem | Mitigasi & Runbook SRE |
| :--- | :--- | :--- |
| **1. Bcrypt / CPU Exhaustion**<br><span style="font-size: 0.8rem; color: var(--on-surface-variant, #6b6b6b); font-weight: normal;">(1MB Password Attack)</span> | Pod Kubernetes CPU 100%, Pod restarts, OOM / Evictions masif. | <span style="color: #2b6e30;">✓</span> Batasi panjang input (maks 128 char) di layer BFF sebelum hashing.<br><span style="color: #2b6e30;">✓</span> Terapkan GCRA Rate Limiting per IP + User. |
| **2. Token Revocation Storm**<br><span style="font-size: 0.8rem; color: var(--on-surface-variant, #6b6b6b); font-weight: normal;">(Redis Blacklist Freeze)</span> | Redis latency melonjak, timeout berantai (cascading failure) ke API Gateway. | <span style="color: #2b6e30;">✓</span> Gunakan short-lived Access Token (5–15 menit).<br><span style="color: #2b6e30;">✓</span> Terapkan Refresh Token rotation; hindari sinkronisasi blacklist di setiap hit API. |
| **3. TOTP MFA Time-Drift**<br><span style="font-size: 0.8rem; color: var(--on-surface-variant, #6b6b6b); font-weight: normal;">(Desinkronisasi Jam Klien)</span> | Pengguna sah gagal login massal akibat deviasi NTP server dan ponsel. | <span style="color: #2b6e30;">✓</span> Izinkan toleransi clock drift ±1 time-step (RFC 6238 window = 30s x 3).<br><span style="color: #2b6e30;">✓</span> Pastikan node Kubernetes tersinkronisasi Chrony/NTP. |
| **4. Key Confusion Attack**<br><span style="font-size: 0.8rem; color: var(--on-surface-variant, #6b6b6b); font-weight: normal;">(RS256 ➔ HS256 Forgery)</span> | Attacker membypass otentikasi via pemalsuan signature menggunakan Public Key. | <span style="color: #2b6e30;">✓</span> Kunci verifikasi algoritma hanya dari JWKS endpoint.<br><span style="color: #2b6e30;">✓</span> Tolak token dengan header `alg: none` atau algoritma simetris tak terduga. |

---

## Chapter 5: Migration Playbook: Menembus 'Relational Monolith' Tanpa Downtime

Jika organisasi Anda saat ini terjebak dengan basis data monolit warisan, jangan lakukan *Big Bang Migration*. Gunakan **Strangler Fig Pattern dengan Lazy Migration (Just-In-Time)**:

<div style="background: var(--surface-container-low, #f4f3f2); border: 1px solid var(--outline, #e5e5e5); border-radius: 8px; padding: 1.5rem; margin: 1.5rem 0; font-family: monospace; font-size: 0.88rem;">
  <!-- Start -->
  <div style="text-align: center; margin-bottom: 0.8rem;">
    <span style="background: var(--surface-container-highest, #e5e4e3); border: 1px solid #165ba6; color: #165ba6; padding: 6px 14px; border-radius: 20px; font-weight: bold;">1. User Login Request</span>
    <div style="color: var(--on-surface-variant, #6b6b6b); margin-top: 0.4rem;">▼</div>
  </div>

  <!-- Step 1 Box -->
  <div style="background: var(--surface-container-lowest, #ffffff); border: 1px solid var(--outline, #e5e5e5); border-radius: 6px; padding: 1rem; margin-bottom: 0.8rem;">
    <div style="color: #165ba6; font-weight: bold;">Cek Status di Managed IdP (Cognito / Auth0)</div>
    <div style="display: flex; justify-content: space-between; margin-top: 0.5rem; gap: 1rem; flex-wrap: wrap;">
      <span style="color: #2b6e30;">➔ SUDAH ADA: Terbitkan Sesi BFF &amp; Selesai (Fast Path)</span>
      <span style="color: #b25e00;">➔ BELUM ADA: Lanjut ke Verifikasi DB Lama (Legacy Path)</span>
    </div>
  </div>

  <div style="text-align: center; color: var(--on-surface-variant, #6b6b6b); margin: 0.4rem 0;">▼ (Legacy Path)</div>

  <!-- Step 2 Box -->
  <div style="background: var(--surface-container-lowest, #ffffff); border: 1px solid var(--outline, #e5e5e5); border-radius: 6px; padding: 1rem; margin-bottom: 0.8rem;">
    <div style="color: #b25e00; font-weight: bold;">Verifikasi Hash Kata Sandi di Basis Data Monolit Lama</div>
    <div style="margin-top: 0.5rem;">
      <div style="color: #a61c14;">✖ GAGAL: Kembalikan 401 Unauthorized (Password Salah)</div>
      <div style="color: #2b6e30; margin-top: 0.4rem;">✔ VALID: Jalankan Migrasi Tepat Waktu (Just-In-Time):</div>
      <ul style="color: var(--on-surface-variant, #6b6b6b); margin: 0.4rem 0 0 1.2rem; line-height: 1.4;">
        <li>Daftarkan user ke Managed IdP via API dengan plaintext password saat ini.</li>
        <li>Tandai flag <code style="color: #165ba6;">migrated = true</code> di basis data lokal.</li>
        <li>Terbitkan Sesi BFF &amp; Kembalikan respons sukses ke pengguna.</li>
      </ul>
    </div>
  </div>
</div>

### Langkah Eksekusi:
1. **Fase 1 (Dual Verification)**: Saat pengguna login, backend memeriksa Managed IdP terlebih dahulu. Jika belum ada, verifikasi hash di database lama.
2. **Fase 2 (Just-In-Time Import)**: Jika kata sandi cocok di database lama, daftarkan pengguna tersebut ke Managed IdP secara otomatis menggunakan kata sandi teks asli yang baru dimasukkan (*zero plaintext storage*).
3. **Fase 3 (Decommission)**: Setelah 90 hari, 80-90% pengguna aktif telah termigrasi otomatis. Pengguna tidak aktif sisanya dapat dipaksa melalui alur *Reset Password* saat kembali.

---

## Chapter 6: Matriks Pengambilan Keputusan (Decision Matrix)

Gunakan matriks ini saat merancang inisiatif rekayasa baru:

| Karakteristik Organisasi & Kebutuhan | Strategi Autentikasi yang Direkomendasikan |
| :--- | :--- |
| • Tim rekayasa ramping (< 100 engineers)<br>• Fokus utama: akselerasi produk & fitur bisnis<br>• Butuh kepatuhan SOC 2 / ISO 27001 / HIPAA cepat | **✅ Managed Cloud IdP**<br><span style="font-size: 0.85rem; color: var(--on-surface-variant, #6b6b6b);">(AWS Cognito, Clerk, Auth0) via Pola **Headless Identity + BFF**</span> |
| • Regulasi ketat residensi data / air-gapped network<br>• Larangan mutlak transfer data identitas ke SaaS luar | **✅ Self-Hosted Open-Source IdP**<br><span style="font-size: 0.85rem; color: var(--on-surface-variant, #6b6b6b);">(Keycloak, Ory Kratos, Zitadel) terisolasi di kluster Kubernetes privat</span> |
| • Skala Big Tech (Google, Netflix, Uber)<br>• Ribuan microservices & miliaran request/detik | **✅ Dedicated Internal Identity Platform Team**<br><span style="font-size: 0.85rem; color: var(--on-surface-variant, #6b6b6b);">(Hanya valid jika biaya R&D teramortisasi penuh ke ratusan produk internal)</span> |

---

## Kesimpulan & Kaidah Utama

Prinsip fundamental bagi para pemimpin teknologi (*engineering leaders*) dan SRE adalah:

> **"Buy for parity, build for competitive advantage."**

Kecuali bisnis inti Anda adalah menjual produk keamanan siber, mengorbankan kapasitas rekayasa dan keandalan sistem untuk membangun ulang brankas kata sandi dari nol adalah bentuk pemborosan sumber daya.

Pisahkan antarmuka dari mesin identitas. Adopsi pola **Headless Identity**, dan biarkan platform teruji menjaga keandalan infrastruktur Anda sepanjang waktu.

---

## Referensi & Bacaan Lanjutan
* [IETF RFC 9700: OAuth 2.0 for Browser-Based Applications](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-browser-based-apps)
* [OWASP Token Storage and Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
* [AWS Cognito Developer Guide: Direct Authentication API](https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-authentication-flow.html)
* [Descope: State of CIAM & In-House Identity Report](https://www.descope.com/)
* [Netflix Technology Blog: Evolution of Edge Identity & Passports](https://netflixtechblog.com/)
