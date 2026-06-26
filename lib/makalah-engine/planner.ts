import type { EngineResult, MakalahEngineInput, MakalahOutline } from "./types";
import { buildOutlinePrompt, DEFAULT_MODEL } from "./prompts";
import { generateJsonWithOpenAI } from "@/lib/ai/openai";

export async function generateOutline(input: MakalahEngineInput): Promise<EngineResult<MakalahOutline>> {
  if (isClickoraProposal(input)) {
    return { data: buildFallbackOutline(input), meta: { model: DEFAULT_MODEL, fallback: true } };
  }

  const aiOutline = await callOpenAI<MakalahOutline>(buildOutlinePrompt(input));

  if (aiOutline) {
    return { data: normalizeOutline(aiOutline.data, input), meta: { model: aiOutline.model, fallback: false } };
  }

  return { data: buildFallbackOutline(input), meta: { model: DEFAULT_MODEL, fallback: true } };
}

export async function callOpenAI<T>(prompt: string): Promise<{ data: T; model: string } | null> {
  return generateJsonWithOpenAI<T>(prompt);
}

function normalizeOutline(outline: MakalahOutline, input: MakalahEngineInput): MakalahOutline {
  const fallback = buildFallbackOutline(input);
  const chapters = fallback.chapters.map((expected) => {
    const actual = outline.chapters?.find((chapter) => chapter.id === expected.id);
    return {
      ...expected,
      ...actual,
      id: expected.id,
      number: expected.number,
      title: actual?.title?.trim() || expected.title,
      subsections: actual?.subsections?.length ? actual.subsections : expected.subsections,
    };
  });

  return {
    title: outline.title?.trim() || input.judul,
    chapters,
    bibliographyPlan: outline.bibliographyPlan?.length ? outline.bibliographyPlan : fallback.bibliographyPlan,
    appendixPlan: outline.appendixPlan || fallback.appendixPlan,
  };
}

function buildFallbackOutline(input: MakalahEngineInput): MakalahOutline {
  const focus = input.tema || input.judul;
  if (isClickoraProposal(input)) return buildClickoraProposalOutline(input);

  const primary = input.assignmentAnalysis?.requiredDeliverables.find((item) => item.type === "proposal" || item.type === "makalah")
    || input.assignmentAnalysis?.requiredDeliverables[0];
  const isProposal = primary?.type === "proposal";
  const bab3Title = isProposal ? "PROFIL OBJEK DAN RENCANA PROYEK" : "PEMBAHASAN / PROFIL OBJEK";
  const bab4Title = isProposal ? "STRATEGI DAN RENCANA IMPLEMENTASI" : "STRATEGI / ANALISIS";

  return {
    title: input.judul || input.assignmentAnalysis?.title || "Makalah Akademik",
    chapters: [
      {
        id: "bab1",
        number: "BAB I",
        title: "PENDAHULUAN",
        purpose: "Menjelaskan konteks, rumusan masalah, tujuan, dan manfaat penulisan.",
        subsections: [
          { id: "1.1", title: "Latar Belakang", bullets: [`Konteks akademik ${focus}`, "Urgensi pembahasan", "Keterkaitan dengan mata kuliah"] },
          { id: "1.2", title: "Rumusan Masalah", bullets: ["Pertanyaan utama yang dibahas", "Batasan fokus makalah"] },
          { id: "1.3", title: "Tujuan Penulisan", bullets: ["Tujuan konseptual", "Tujuan praktis"] },
        ],
      },
      {
        id: "bab2",
        number: "BAB II",
        title: "LANDASAN TEORI",
        purpose: "Menyajikan konsep dan teori yang menjadi dasar analisis.",
        subsections: [
          { id: "2.1", title: "Konsep Dasar", bullets: [`Definisi terkait ${focus}`, "Ruang lingkup konsep"] },
          { id: "2.2", title: "Kerangka Teoretis", bullets: ["Teori pendukung", "Hubungan teori dengan kasus"] },
          { id: "2.3", title: "Penelitian atau Literatur Terkait", bullets: ["Temuan literatur", "Posisi makalah"] },
        ],
      },
      {
        id: "bab3",
        number: "BAB III",
        title: bab3Title,
        purpose: "Menguraikan objek, konteks, dan temuan pembahasan utama.",
        subsections: [
          { id: "3.1", title: "Gambaran Umum Objek", bullets: [`Deskripsi ${focus}`, "Karakteristik objek"] },
          { id: "3.2", title: isProposal ? "Rencana Mini Project" : "Kondisi dan Permasalahan", bullets: ["Gejala utama", "Faktor yang memengaruhi"] },
          { id: "3.3", title: isProposal ? "Kebutuhan dan Batasan Pelaksanaan" : "Pembahasan Tematik", bullets: ["Analisis awal", "Keterkaitan dengan teori"] },
        ],
      },
      {
        id: "bab4",
        number: "BAB IV",
        title: bab4Title,
        purpose: "Menyusun analisis dan rekomendasi strategi secara terarah.",
        subsections: [
          { id: "4.1", title: "Analisis Masalah", bullets: ["Akar masalah", "Dampak akademik atau praktis"] },
          { id: "4.2", title: isProposal ? "Strategi Pelaksanaan" : "Alternatif Strategi", bullets: ["Opsi penyelesaian", "Pertimbangan implementasi"] },
          { id: "4.3", title: isProposal ? "Timeline dan Indikator Evaluasi" : "Rekomendasi", bullets: ["Rekomendasi utama", "Alasan pemilihan"] },
        ],
      },
      {
        id: "bab5",
        number: "BAB V",
        title: "PENUTUP",
        purpose: "Merangkum simpulan dan saran.",
        subsections: [
          { id: "5.1", title: "Kesimpulan", bullets: ["Jawaban atas rumusan masalah", "Inti hasil analisis"] },
          { id: "5.2", title: "Saran", bullets: ["Saran akademik", "Saran praktis"] },
        ],
      },
    ],
    bibliographyPlan: [
      "Buku metodologi atau teori utama yang relevan",
      "Artikel jurnal tentang tema makalah",
      "Sumber institusional atau laporan resmi bila diperlukan",
    ],
    appendixPlan: input.assignmentAnalysis?.requiredDeliverables.length
      ? ["Checklist deliverable tugas dosen", "Catatan data asli atau simulasi perencanaan"]
      : input.pedoman ? ["Ringkasan pedoman penulisan"] : [],
  };
}

function buildClickoraProposalOutline(input: MakalahEngineInput): MakalahOutline {
  return {
    title: input.judul || "Proposal Mini Project Social Media Marketing Clickora",
    chapters: [
      {
        id: "bab1",
        number: "BAB I",
        title: "PENDAHULUAN",
        purpose: "Menjelaskan dasar penyusunan proposal mini project Custom Clicker Nama.",
        subsections: [
          { id: "1.1", title: "Latar Belakang", bullets: ["Peluang produk personalisasi", "Relevansi Clickora di media sosial"] },
          { id: "1.2", title: "Rumusan Masalah", bullets: ["Masalah branding", "Masalah pemasaran digital"] },
          { id: "1.3", title: "Tujuan Penulisan", bullets: ["Tujuan proposal", "Tujuan strategi media sosial"] },
          { id: "1.4", title: "Manfaat Penulisan", bullets: ["Manfaat akademik", "Manfaat praktis untuk Clickora"] },
        ],
      },
      {
        id: "bab2",
        number: "BAB II",
        title: "BRAND & PRODUK",
        purpose: "Menguraikan identitas brand Clickora dan produk Custom Clicker Nama.",
        subsections: [
          { id: "2.1", title: "Nama Brand", bullets: ["Clickora sebagai nama brand", "Makna nama"] },
          { id: "2.2", title: "Deskripsi Brand", bullets: ["Karakter brand", "Tagline Klik Namamu, Tunjukkan Gayamu"] },
          { id: "2.3", title: "Visi, Misi, dan Nilai Brand", bullets: ["Visi Clickora", "Misi dan nilai"] },
          { id: "2.4", title: "Deskripsi Produk Custom Clicker Nama", bullets: ["Fungsi produk", "Personalisasi nama"] },
          { id: "2.5", title: "Keunggulan Produk", bullets: ["Unik", "Terjangkau", "Cocok untuk gaya personal"] },
        ],
      },
      {
        id: "bab3",
        number: "BAB III",
        title: "TARGET MARKET",
        purpose: "Menentukan segmen dan persona pelanggan Clickora.",
        subsections: [
          { id: "3.1", title: "Segmentasi Pasar", bullets: ["Demografis", "Psikografis", "Perilaku digital"] },
          { id: "3.2", title: "Targeting", bullets: ["Target utama", "Target sekunder"] },
          { id: "3.3", title: "Positioning", bullets: ["Posisi Clickora", "Pembeda brand"] },
          { id: "3.4", title: "Persona Pelanggan", bullets: ["Persona pelajar/mahasiswa", "Persona pembeli hadiah"] },
        ],
      },
      {
        id: "bab4",
        number: "BAB IV",
        title: "MARKETING MIX 4P",
        purpose: "Menyusun strategi Product, Price, Place, dan Promotion untuk Clickora.",
        subsections: [
          { id: "4.1", title: "Product", bullets: ["Custom Clicker Nama", "Variasi desain"] },
          { id: "4.2", title: "Price", bullets: ["Simulasi harga", "Nilai personalisasi"] },
          { id: "4.3", title: "Place", bullets: ["Instagram", "TikTok", "Shopee"] },
          { id: "4.4", title: "Promotion", bullets: ["Konten organik", "Promo launching", "UGC"] },
        ],
      },
      {
        id: "bab5",
        number: "BAB V",
        title: "STRATEGI BRANDING & MEDIA SOSIAL",
        purpose: "Merancang gaya komunikasi dan strategi engagement Clickora.",
        subsections: [
          { id: "5.1", title: "Gaya Komunikasi", bullets: ["Friendly", "Ekspresif", "Anak muda"] },
          { id: "5.2", title: "Jenis Konten", bullets: ["Product showcase", "Behind the scenes", "Testimoni"] },
          { id: "5.3", title: "Platform yang Digunakan", bullets: ["Instagram", "TikTok", "Shopee"] },
          { id: "5.4", title: "Strategi Engagement", bullets: ["Polling", "Challenge", "Komentar nama"] },
        ],
      },
      {
        id: "bab6",
        number: "BAB VI",
        title: "RENCANA TIMELINE & TARGET MINGGUAN",
        purpose: "Menjabarkan timeline Week 1 sampai Week 14, target mingguan, dan pembagian tugas tim.",
        subsections: [
          { id: "6.1", title: "Timeline Week 1 sampai Week 14", bullets: ["Tahap perencanaan", "Produksi konten", "Evaluasi"] },
          { id: "6.2", title: "Target Mingguan", bullets: ["Target output", "Simulasi indikator"] },
          { id: "6.3", title: "Pembagian Tugas Tim", bullets: ["Konten", "Desain", "Admin marketplace"] },
        ],
      },
      {
        id: "bab7",
        number: "BAB VII",
        title: "PENUTUP",
        purpose: "Merumuskan kesimpulan dan saran proposal Clickora.",
        subsections: [
          { id: "7.1", title: "Kesimpulan", bullets: ["Inti proposal", "Kelayakan strategi"] },
          { id: "7.2", title: "Saran", bullets: ["Pengembangan konten", "Validasi data asli"] },
        ],
      },
    ],
    bibliographyPlan: [
      "Kotler dan Keller tentang manajemen pemasaran",
      "Tuten dan Solomon tentang social media marketing",
      "Chaffey dan Ellis-Chadwick tentang digital marketing",
    ],
    appendixPlan: ["Konsep visual brand", "Foto produk placeholder", "Contoh caption", "Contoh content calendar"],
  };
}

function isClickoraProposal(input: MakalahEngineInput): boolean {
  const text = [
    input.judul,
    input.tema,
    input.mataKuliah,
    input.pedoman,
    JSON.stringify(input.assignmentAnalysis || {}),
  ].join(" ").toLowerCase();
  return /proposal|mini project|week\s*1|social media marketing|clickora|custom clicker/.test(text);
}
