# Skripsi Analyzer – FEB UNPAM

Aplikasi analisis data skripsi Manajemen Pemasaran format UNPAM/FEB berbasis web.
Semua proses berjalan **client-side** — tidak ada data yang dikirim ke server.

> ⚠️ **Pastikan data berasal dari responden asli.**

---

## Fitur

| Fitur | Deskripsi |
|-------|-----------|
| Upload Excel/CSV | Drag-and-drop atau pilih file, auto-deteksi kolom variabel |
| Mapping Variabel | Tentukan X1, X2, Y dan item masing-masing |
| Statistik Deskriptif | Frekuensi Likert 1–5, skor total, mean, kategori STS/TS/KS/S/SS |
| Uji Validitas | Pearson item-total vs r tabel (dapat diedit, default n=100: 0.196) |
| Uji Reliabilitas | Cronbach's Alpha per variabel |
| Regresi Linear Berganda | Y = a + b₁X₁ + b₂X₂, koefisien, t hitung, p-value |
| Uji F & R² | F hitung, sig F, R, R Square, Adjusted R² |
| Multikolinearitas | Tolerance, VIF per variabel X |
| Normalitas Residual | Mean & std residual |
| Heteroskedastisitas | Pendekatan Glejser (korelasi |e| dengan X) |
| Narasi Bab 4 | Teks otomatis Bahasa Indonesia, tombol salin |

---

## Tech Stack

- **Next.js 16** App Router
- **TypeScript**
- **Tailwind CSS v4**
- **shadcn/ui**
- **xlsx** – baca file Excel/CSV
- **Semua kalkulasi custom** – tanpa library statistik eksternal

---

## Cara Menjalankan

```bash
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

---

## Build Production

```bash
npm run build
npm start
```

---

## Template Data

Download template Excel di: `public/templates/template-data-responden.xlsx`

Kolom template:
- `Responden` – nomor/nama responden
- `X1.1` – `X1.10` – item variabel X1
- `X2.1` – `X2.10` – item variabel X2
- `Y.1` – `Y.10` – item variabel Y

Isi setiap sel item dengan skor Likert **1–5**.

---

## Struktur Folder

```
app/
  page.tsx          → Dashboard
  upload/           → Upload & preview data
  mapping/          → Mapping variabel
  deskriptif/       → Statistik deskriptif
  validitas/        → Uji validitas
  reliabilitas/     → Uji reliabilitas
  regresi/          → Regresi & asumsi klasik
  narasi/           → Narasi Bab 4

components/
  layout/           → Sidebar, AppShell
  ui/               → shadcn/ui components

lib/
  context.tsx       → Global state (React Context + sessionStorage)
  store.ts          → Session storage helpers
  excel/parser.ts   → Excel/CSV parser (xlsx)
  statistics/
    descriptive.ts  → Statistik deskriptif Likert
    validity.ts     → Uji validitas (Pearson)
    reliability.ts  → Cronbach's Alpha
    regression.ts   → Regresi, multikolinearitas, normalitas, heteroskedastisitas
  narratives/
    generator.ts    → Generator narasi Bab 4 Bahasa Indonesia

types/index.ts      → TypeScript interfaces
public/templates/   → Template Excel
```

---

## Catatan

- Tidak memerlukan database atau backend
- Data tersimpan sementara di `sessionStorage` browser (hilang saat tab ditutup)
- Tidak ada login
- Tidak terhubung ke Supabase, AturGudang, atau layanan eksternal manapun
