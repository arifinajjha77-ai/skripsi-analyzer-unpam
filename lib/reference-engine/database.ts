export type TopicKey =
  | "validitas"
  | "reliabilitas"
  | "regresi"
  | "uji_t"
  | "uji_f"
  | "r_square"
  | "multikolinearitas"
  | "normalitas"
  | "heteroskedastisitas"
  | "metodologi";

export interface Reference {
  id: string;
  judul: string;
  penulis: string[];        // e.g. ["Imam Ghozali"]
  tahun: number;
  edisi?: string;
  penerbit: string;
  kota: string;
  topik: TopicKey[];

  /** Short in-text citation, e.g. "(Ghozali, 2018)" */
  apaInText: string;
  /** Full APA-7 bibliography entry */
  apaFull: string;

  /** Criterion/rule stated by this reference for each topic */
  aturan: Partial<Record<TopicKey, string>>;
  /** Theoretical intro sentence inserted before results */
  teori: Partial<Record<TopicKey, string>>;
}

// ─── Database ────────────────────────────────────────────────────────────────

export const REFERENCE_DB: Reference[] = [
  /* ── Ghozali ─────────────────────────────────────── */
  {
    id: "ghozali2018",
    judul: "Aplikasi Analisis Multivariate dengan Program IBM SPSS 25",
    penulis: ["Imam Ghozali"],
    tahun: 2018,
    edisi: "9",
    penerbit: "Badan Penerbit Universitas Diponegoro",
    kota: "Semarang",
    topik: ["reliabilitas", "multikolinearitas", "normalitas", "heteroskedastisitas", "r_square", "uji_f"],
    apaInText: "(Ghozali, 2018)",
    apaFull:
      "Ghozali, I. (2018). Aplikasi Analisis Multivariate dengan Program IBM SPSS 25 (Edisi ke-9). Semarang: Badan Penerbit Universitas Diponegoro.",
    aturan: {
      reliabilitas:
        "instrumen penelitian dinyatakan reliabel apabila nilai Cronbach's Alpha ≥ 0,60",
      multikolinearitas:
        "model bebas dari multikolinearitas apabila nilai Tolerance > 0,10 dan VIF < 10",
      normalitas:
        "residual berdistribusi normal apabila nilai signifikansi uji Kolmogorov-Smirnov > 0,05",
      heteroskedastisitas:
        "tidak terjadi heteroskedastisitas apabila nilai signifikansi variabel independen terhadap absolut residual > 0,05",
      r_square:
        "koefisien determinasi (R²) menunjukkan seberapa besar variasi variabel dependen dapat dijelaskan oleh variabel independen dalam model",
      uji_f:
        "model regresi dinyatakan fit apabila nilai F hitung signifikan pada α = 0,05",
    },
    teori: {
      reliabilitas:
        "Menurut Ghozali (2018), uji reliabilitas digunakan untuk mengukur konsistensi suatu instrumen pengukuran. Instrumen penelitian dinyatakan reliabel apabila nilai Cronbach's Alpha ≥ 0,60. Semakin tinggi nilai Alpha, semakin tinggi pula konsistensi internal instrumen tersebut.",
      multikolinearitas:
        "Ghozali (2018) menyatakan bahwa uji multikolinearitas bertujuan untuk menguji apakah dalam model regresi ditemukan adanya korelasi yang tinggi atau sempurna antar variabel independen. Model yang baik seharusnya tidak mengalami multikolinearitas, dengan kriteria nilai Tolerance > 0,10 dan VIF < 10.",
      normalitas:
        "Ghozali (2018) mengemukakan bahwa uji normalitas bertujuan untuk menguji apakah dalam model regresi, variabel pengganggu atau residual memiliki distribusi normal. Jika distribusi residual tidak normal maka hasil uji statistik menjadi tidak valid.",
      heteroskedastisitas:
        "Menurut Ghozali (2018), uji heteroskedastisitas bertujuan untuk menguji apakah dalam model regresi terjadi ketidaksamaan varians dari residual satu pengamatan ke pengamatan yang lain. Model regresi yang baik adalah yang tidak terjadi heteroskedastisitas.",
      r_square:
        "Ghozali (2018) menjelaskan bahwa koefisien determinasi (R²) pada intinya mengukur seberapa jauh kemampuan model dalam menerangkan variasi variabel dependen. Nilai R² yang kecil berarti kemampuan variabel-variabel independen dalam menjelaskan variasi variabel dependen sangat terbatas.",
      uji_f:
        "Ghozali (2018) menyatakan bahwa uji statistik F pada dasarnya menunjukkan apakah semua variabel independen yang dimasukkan dalam model mempunyai pengaruh secara bersama-sama terhadap variabel dependen. Kriteria penerimaan hipotesis adalah apabila nilai F hitung memiliki signifikansi < 0,05.",
    },
  },

  /* ── Sugiyono ────────────────────────────────────── */
  {
    id: "sugiyono2019",
    judul: "Metode Penelitian Kuantitatif, Kualitatif, dan R&D",
    penulis: ["Sugiyono"],
    tahun: 2019,
    edisi: "2",
    penerbit: "Alfabeta",
    kota: "Bandung",
    topik: ["validitas", "reliabilitas", "metodologi"],
    apaInText: "(Sugiyono, 2019)",
    apaFull:
      "Sugiyono. (2019). Metode Penelitian Kuantitatif, Kualitatif, dan R&D (Edisi ke-2). Bandung: Alfabeta.",
    aturan: {
      validitas:
        "instrumen dikatakan valid apabila nilai r hitung > r tabel pada taraf signifikansi 5%",
      reliabilitas:
        "instrumen dinyatakan reliabel apabila nilai koefisien reliabilitas ≥ 0,60",
    },
    teori: {
      validitas:
        "Menurut Sugiyono (2019), validitas adalah derajat ketepatan antara data yang terjadi pada objek penelitian dengan daya yang dapat dilaporkan oleh peneliti. Uji validitas dilakukan menggunakan korelasi Product Moment Pearson, di mana item pernyataan dinyatakan valid apabila nilai r hitung lebih besar dari r tabel pada taraf signifikansi 5%.",
      reliabilitas:
        "Sugiyono (2019) menjelaskan bahwa reliabilitas instrumen adalah tingkat keandalan atau konsistensi instrumen penelitian. Instrumen yang reliabel akan menghasilkan data yang sama meskipun digunakan berkali-kali untuk mengukur objek yang sama.",
    },
  },

  /* ── Arikunto ────────────────────────────────────── */
  {
    id: "arikunto2016",
    judul: "Prosedur Penelitian: Suatu Pendekatan Praktik",
    penulis: ["Suharsimi Arikunto"],
    tahun: 2016,
    edisi: "15",
    penerbit: "Rineka Cipta",
    kota: "Jakarta",
    topik: ["validitas", "reliabilitas"],
    apaInText: "(Arikunto, 2016)",
    apaFull:
      "Arikunto, S. (2016). Prosedur Penelitian: Suatu Pendekatan Praktik (Edisi ke-15). Jakarta: Rineka Cipta.",
    aturan: {
      validitas:
        "butir soal dikatakan valid jika nilai korelasi r hitung ≥ r tabel",
      reliabilitas:
        "instrumen reliabel apabila memiliki nilai Alpha Cronbach di atas 0,60",
    },
    teori: {
      validitas:
        "Arikunto (2016) menyatakan bahwa validitas adalah suatu ukuran yang menunjukkan tingkat-tingkat kevalidan atau kesahihan suatu instrumen. Butir instrumen dinyatakan valid apabila nilai koefisien korelasi (r hitung) lebih besar dari atau sama dengan nilai r tabel pada taraf signifikansi yang digunakan.",
      reliabilitas:
        "Menurut Arikunto (2016), reliabilitas menunjuk pada suatu pengertian bahwa suatu instrumen cukup dapat dipercaya untuk digunakan sebagai alat pengumpul data karena instrumen tersebut sudah baik. Instrumen dinyatakan reliabel apabila nilai Alpha Cronbach di atas 0,60.",
    },
  },

  /* ── Priyatno ────────────────────────────────────── */
  {
    id: "priyatno2016",
    judul: "Belajar Alat Analisis Data dan Cara Pengolahannya dengan SPSS",
    penulis: ["Duwi Priyatno"],
    tahun: 2016,
    edisi: "1",
    penerbit: "Gava Media",
    kota: "Yogyakarta",
    topik: ["regresi", "uji_t", "uji_f"],
    apaInText: "(Priyatno, 2016)",
    apaFull:
      "Priyatno, D. (2016). Belajar Alat Analisis Data dan Cara Pengolahannya dengan SPSS (Edisi ke-1). Yogyakarta: Gava Media.",
    aturan: {
      regresi:
        "regresi linear berganda digunakan untuk mengetahui pengaruh dua atau lebih variabel independen terhadap variabel dependen",
      uji_t:
        "variabel independen berpengaruh signifikan secara parsial apabila nilai signifikansi (Sig.) < 0,05",
      uji_f:
        "model regresi dinyatakan fit dan variabel independen berpengaruh simultan apabila nilai Sig. < 0,05",
    },
    teori: {
      regresi:
        "Priyatno (2016) mengemukakan bahwa analisis regresi linear berganda adalah hubungan secara linear antara dua atau lebih variabel independen dengan variabel dependen. Analisis ini bertujuan untuk memprediksi nilai dari variabel dependen apabila nilai variabel independen mengalami kenaikan atau penurunan.",
      uji_t:
        "Menurut Priyatno (2016), uji t digunakan untuk mengetahui apakah variabel independen secara parsial berpengaruh signifikan terhadap variabel dependen. Dasar pengambilan keputusan adalah apabila nilai Sig. < 0,05 maka variabel independen berpengaruh signifikan secara parsial.",
      uji_f:
        "Priyatno (2016) menyatakan bahwa uji F digunakan untuk mengetahui apakah variabel independen secara bersama-sama berpengaruh signifikan terhadap variabel dependen. Model regresi dikatakan baik dan dapat digunakan apabila nilai Sig. F < 0,05.",
    },
  },

  /* ── Hair et al. ─────────────────────────────────── */
  {
    id: "hair2019",
    judul: "Multivariate Data Analysis",
    penulis: ["Joseph F. Hair", "William C. Black", "Barry J. Babin", "Rolph E. Anderson"],
    tahun: 2019,
    edisi: "8",
    penerbit: "Cengage Learning",
    kota: "Hampshire",
    topik: ["multikolinearitas"],
    apaInText: "(Hair et al., 2019)",
    apaFull:
      "Hair, J. F., Black, W. C., Babin, B. J., & Anderson, R. E. (2019). Multivariate Data Analysis (8th ed.). Hampshire: Cengage Learning.",
    aturan: {
      multikolinearitas:
        "masalah multikolinearitas serius terjadi apabila VIF melebihi 10, meskipun beberapa peneliti menggunakan batas VIF 5",
    },
    teori: {
      multikolinearitas:
        "Hair et al. (2019) menyebutkan bahwa multikolinearitas merupakan kondisi di mana variabel independen saling berkorelasi tinggi satu sama lain. Kondisi ini dapat mengakibatkan estimasi koefisien regresi menjadi tidak stabil dan tidak reliabel. Masalah multikolinearitas serius terjadi apabila nilai VIF melebihi 10.",
    },
  },

  /* ── Sekaran & Bougie ────────────────────────────── */
  {
    id: "sekaran2019",
    judul: "Research Methods for Business: A Skill Building Approach",
    penulis: ["Uma Sekaran", "Roger Bougie"],
    tahun: 2019,
    edisi: "8",
    penerbit: "John Wiley & Sons",
    kota: "New York",
    topik: ["validitas", "metodologi"],
    apaInText: "(Sekaran & Bougie, 2019)",
    apaFull:
      "Sekaran, U., & Bougie, R. (2019). Research Methods for Business: A Skill Building Approach (8th ed.). New York: John Wiley & Sons.",
    aturan: {
      validitas:
        "content validity, construct validity, dan criterion validity merupakan tiga jenis validitas utama dalam penelitian bisnis",
    },
    teori: {
      validitas:
        "Sekaran & Bougie (2019) menyatakan bahwa validitas instrumen berkaitan dengan seberapa tepat instrumen penelitian mengukur konsep yang ingin diukur. Pengujian validitas diperlukan untuk memastikan bahwa alat ukur yang digunakan dalam penelitian benar-benar mengukur apa yang seharusnya diukur.",
    },
  },
];

// ── Topic → References Map ───────────────────────────────────────────────────

export function getReferencesByTopic(topic: TopicKey): Reference[] {
  return REFERENCE_DB.filter((r) => r.topik.includes(topic));
}

export function getReferenceById(id: string): Reference | undefined {
  return REFERENCE_DB.find((r) => r.id === id);
}
