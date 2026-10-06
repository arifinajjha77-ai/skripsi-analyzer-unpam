# Acuan format FEB UNPAM 2021

Sumber: PDF yang diberikan pemilik aplikasi, **PEDOMAN TUGAS AKHIR FEB 2021 fix.pdf**, cetakan pertama Oktober 2021. Salinan asli: `public/pedoman/feb-unpam-2021.pdf`.

| Ketentuan | Halaman tercetak | Implementasi |
|---|---|---|
| Proposal: A4, TNR12, margin atas/kiri4 kanan/bawah3, header/footer2, spasi2, indent1,5 | 5–6 | `templates/feb2021.ts`, `docx/feb2021.ts` |
| Skripsi: format isi yang sama; angka romawi bagian awal dan arab berlanjut | 19–20 | Section cover/front/chapter/back di eksportir dokumen lengkap |
| Tabel/gambar: caption bernomor, tabel dalam margin, spasi1 dan sumber10pt | 6–8, 20–22 | Eksportir assignment, makalah, tabel penelitian |
| Kutipan dalam teks dan APA sesuai contoh (kota:penerbit), umur referensi maksimal10tahun | 8–10, 22–24 | Instruksi generator, validator referensi, bibliographyBuilder |
| Sistematika proposal/skripsi kuantitatif dan kualitatif | 11–12, 25–28 | `febThesisOutline`, generator assignment dan planner |
| Makalah komprehensif spasi1,5; minimal30halaman,5referensi, tinjauan kritis3jurnal | 39–45 | Profil khusus komprehensif dan instruksi generator |
| Sampul judul14pt, logo5×5cm, identitas12pt | Lampiran1–3 | Sampul proposal/skripsi |

Tugas kuliah biasa tidak memiliki aturan khusus dalam buku ini. Aplikasi memakai spasi1,5 sebagai default dan mempertahankan struktur tugas dosen. Label profil menjelaskan perbedaan ini.

## Validasi

`npm run test:pedoman` menghasilkan DOCX dari sembilan jalur ekspor, lalu membaca XML aktual untuk memeriksa geometri, spasi, indentasi, penomoran section, urutan referensi dan tabel. `npm run typecheck` dan `npm run build` memeriksa integrasi Next.js.

Daftar isi/daftar tabel/daftar gambar merupakan field Word; perbarui field setelah membuka dokumen. Berkas sesi lama perlu digenerate ulang untuk menerapkan struktur baru. Hasil penelitian, metadata referensi, abstrak, lembar pengesahan, kecukupan halaman serta lampiran wajib tetap diperiksa menggunakan data asli; aplikasi tidak mengarangnya.

Referensi bawaan kewirausahaan tahun2008 diganti dengan Barringer & Ireland (2019), edisi6, Harlow:Pearson, sesuai katalog penerbit dan katalog perpustakaan. Tahun referensi tetap tahun terbit asli dan tidak diubah agar terlihat baru.

Sumber pemeriksaan bibliografis: https://www.pearson.com/en-us/subject-catalog/p/entrepreneurship-successfully-launching-new-ventures/P200000005825/9780136878681 dan https://search.worldcat.org/title/Entrepreneurship-%3A-successfully-launching-new-ventures/oclc/1064063093.

## Pembaruan khusus menu Skripsi

Banner acuan 2021 tampil di seluruh 15 halaman kelompok Skripsi. Menu statistik tetap dapat dibuka untuk melihat prasyarat, tetapi hasil analisis memerlukan data dan mapping. BAB I memiliki pilihan skripsi (1.1–1.4) atau proposal/sempro (1.1–1.5). Ekspor BAB I menyertakan daftar pustaka yang dipakai; tabel berstatus data tidak tersedia dihilangkan. Narasi statistik BAB IV ditempatkan pada 4.2 dan 4.2.1–4.2.9. Bagian 4.1 dan 4.3 perlu ditulis berdasarkan profil objek dan kajian penelitian asli.

Author mapping lama memuat atribusi tahun yang belum terverifikasi, termasuk Kaplan & Haenlein (2022). Pemilihan otomatis kini memakai edisi bibliografis yang diperiksa, mempertahankan tahun asli, serta tidak memaksakan sumber pemasaran pada variabel di luar cakupannya. Definisi dan halaman kutipan harus diperiksa pada edisi yang benar-benar digunakan penulis.

Katalog pendukung: https://uk.sagepub.com/sites/default/files/upm-assets/89036_book_item_89036.pdf ; https://www.pearson.com/en-us/subject-catalog/p/Kotler-Marketing-Management-15th-Edition/P200000007478?view=educator ; https://library.fra.ac.uk/bib/36828 .
