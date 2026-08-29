---
marp: true
theme: custom-blog-theme
paginate: true
---

# Realitas DevOps: Di Balik Mitos 'Automate & Chill'

Mengapa otomasi bukan tiket untuk duduk santai, dan bagaimana praktisi SRE mengelola stabilitas produksi.

<footer>
  <span>Abdul Aziz Zailani</span>
  <span>Slide 1 / 5</span>
</footer>

---

## 1. Siklus Kematian Kontainer

Status `CrashLoopBackOff` dan latensi `etcd timeout` bukan bug biasa:
- **OOMKilled**: Memory limit terlalu ketat.
- **Probe Failure**: Liveness probe timeout saat pod startup.
- **Control Plane Bottleneck**: Disk IOPS etcd tercekik.

<footer>
  <span>abdul-zailani.github.io</span>
  <span>Slide 2 / 5</span>
</footer>

---

## 2. Bahaya Alert Fatigue Jam 3 Pagi

Alarm statis berbasis threshold CPU 80% membakar energi tim on-call:
- 80% notifikasi seringkali merupakan alarm palsu (*false positive*).
- **Solusinya**: Terapkan *multi-window burn rate alerting* berbasis SLO ketersediaan nyata.

<footer>
  <span>abdul-zailani.github.io</span>
  <span>Slide 3 / 5</span>
</footer>

---

## 3. Progressive Delivery Sebagai Jaring Pengaman

Jangan rilis langsung ke 100% traffic:
- Gunakan **Canary Deployment** (10% $\rightarrow$ 25% $\rightarrow$ 100%).
- Pasang **Automated Rollback** saat tingkat error melonjak.
- Terapkan kebijakan *deployment freeze* di hari rawan.

<footer>
  <span>abdul-zailani.github.io</span>
  <span>Slide 4 / 5</span>
</footer>

---

## 4. Kesimpulan & Aksi Nyata

Otomasi adalah sarana mempercepat rilis, tetapi keandalan membutuhkan disiplin observabilitas dan arsitektur matang.

> Baca analisis lengkap dan playbook mitigasinya di:
> **abdul-zailani.github.io/blog**

<footer>
  <span>Simpan & Bagikan</span>
  <span>Slide 5 / 5</span>
</footer>
