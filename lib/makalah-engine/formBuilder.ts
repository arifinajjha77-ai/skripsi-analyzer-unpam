import type { AssignmentAnalysis, DynamicField, DynamicFormSchema } from "./types";

export function buildDynamicFormSchema(analysis: AssignmentAnalysis): DynamicFormSchema {
  const text = [
    analysis.title,
    analysis.course,
    analysis.summaryForStudent,
    ...analysis.requiredDeliverables.flatMap((item) => [item.name, item.description, ...item.requiredSections]),
  ].join(" ").toLowerCase();

  if (matches(text, ["social media marketing", "mini project", "proposal"])) {
    return schema(
      "Silakan lengkapi data proposal mini project",
      "Data ini akan dipakai sebagai bahan proposal. Instruksi dosen tetap disimpan sebagai blueprint internal.",
      [
        field("brandName", "Nama Brand", "text", true, "Contoh: Clickora", "Clickora"),
        field("productName", "Produk", "text", true, "Contoh: Custom Clicker Nama", "Custom Clicker Nama"),
        field("tagline", "Tagline", "text", false, "Contoh: Klik Namamu, Tunjukkan Gayamu", "Klik Namamu, Tunjukkan Gayamu"),
        field("productDescription", "Deskripsi Produk", "textarea", true, "Jelaskan produk, fungsi, bahan, variasi, dan alasan produk menarik."),
        field("targetMarket", "Target Market", "textarea", true, "Contoh: pelajar, mahasiswa, pembeli hadiah personal, pengguna aktif TikTok."),
        field("socialPlatforms", "Platform Media Sosial", "text", true, "Contoh: Instagram, TikTok, Shopee", "Instagram, TikTok, Shopee"),
        field("logo", "Logo (opsional)", "image", false, "Upload logo bila sudah ada."),
        field("productPhoto", "Foto Produk (opsional)", "image", false, "Upload foto produk bila sudah ada."),
        field("groupName", "Nama Kelompok", "text", false, "Contoh: Kelompok 3"),
        field("members", "Nama Anggota", "textarea", true, "Tulis nama anggota per baris."),
        field("nim", "NIM", "textarea", true, "Tulis NIM sesuai urutan anggota."),
        field("className", "Kelas", "text", true, "Contoh: 06SMJP001"),
        field("lecturerName", "Nama Dosen", "text", true, "Contoh: [Nama Dosen]"),
        field("campusName", "Nama Kampus", "text", false, "Contoh: Universitas Pamulang"),
        field("faculty", "Fakultas", "text", false, "Contoh: Fakultas Ekonomi dan Bisnis"),
        field("studyProgram", "Program Studi", "text", false, "Contoh: Manajemen"),
      ]
    );
  }

  if (matches(text, ["proposal bisnis", "business proposal", "usaha"])) {
    return schema("Silakan lengkapi data proposal bisnis", "Isi data utama agar proposal bisnis dapat disusun.", [
      field("businessName", "Nama Usaha", "text", true, "Contoh: Kedai Kopi Senja"),
      field("productName", "Produk", "text", true, "Produk atau layanan utama"),
      field("capital", "Modal", "text", true, "Estimasi modal awal"),
      field("targetMarket", "Target Market", "textarea", true, "Segmen pelanggan utama"),
      field("swot", "Analisis SWOT", "textarea", true, "Strength, weakness, opportunity, threat"),
      field("logo", "Logo", "image", false, "Upload logo bila ada"),
      field("members", "Nama Anggota", "textarea", true, "Tulis nama anggota"),
      field("nim", "NIM", "textarea", true, "Tulis NIM"),
      field("className", "Kelas", "text", true, "Kelas"),
      field("lecturerName", "Nama Dosen", "text", true, "Nama dosen"),
    ]);
  }

  if (matches(text, ["laporan pkl", "praktik kerja", "magang"])) {
    return schema("Silakan lengkapi data laporan PKL", "Isi data tempat dan aktivitas PKL.", [
      field("companyName", "Nama Perusahaan", "text", true, "Nama perusahaan"),
      field("division", "Divisi", "text", true, "Divisi atau unit kerja"),
      field("internshipPeriod", "Periode PKL", "text", true, "Contoh: Januari-Maret 2026"),
      field("supervisor", "Pembimbing", "text", true, "Pembimbing lapangan/kampus"),
      field("activities", "Aktivitas", "textarea", true, "Aktivitas utama selama PKL"),
      field("members", "Nama Mahasiswa", "textarea", true, "Nama mahasiswa"),
      field("nim", "NIM", "textarea", true, "NIM"),
      field("className", "Kelas", "text", true, "Kelas"),
    ]);
  }

  if (matches(text, ["skripsi", "penelitian", "variabel", "responden"])) {
    return schema("Silakan lengkapi data skripsi", "Isi data penelitian yang belum ada.", [
      field("researchTitle", "Judul", "textarea", true, "Judul penelitian"),
      field("variables", "Variabel", "textarea", true, "Variabel X/Y atau variabel penelitian"),
      field("method", "Metode", "text", true, "Contoh: kuantitatif"),
      field("object", "Objek", "text", true, "Objek penelitian"),
      field("location", "Lokasi", "text", true, "Lokasi penelitian"),
      field("respondents", "Responden", "text", true, "Jumlah/kriteria responden"),
      field("studentName", "Nama Mahasiswa", "text", true, "Nama mahasiswa"),
      field("nim", "NIM", "text", true, "NIM"),
    ]);
  }

  return schema("Silakan lengkapi data tugas", "AI sudah membaca instruksi. Lengkapi data yang belum tersedia agar dokumen bisa dibuat.", [
    field("title", "Judul", "textarea", true, "Judul dokumen"),
    field("topic", "Topik/Objek", "textarea", true, "Topik, produk, objek, atau studi kasus"),
    field("requiredContent", "Informasi Penting", "textarea", true, "Data utama yang harus masuk dokumen"),
    field("members", "Nama Mahasiswa/Kelompok", "textarea", true, "Nama mahasiswa atau anggota kelompok"),
    field("nim", "NIM", "textarea", true, "NIM"),
    field("className", "Kelas", "text", true, "Kelas"),
    field("lecturerName", "Nama Dosen", "text", true, "Nama dosen"),
  ]);
}

function schema(title: string, description: string, fields: DynamicField[]): DynamicFormSchema {
  return { title, description, fields };
}

function field(
  id: string,
  label: string,
  type: DynamicField["type"],
  required: boolean,
  placeholder: string,
  defaultValue?: string,
  options?: string[]
): DynamicField {
  return { id, label, type, required, placeholder, defaultValue, options };
}

function matches(text: string, keywords: string[]): boolean {
  return keywords.some((keyword) => text.includes(keyword));
}
