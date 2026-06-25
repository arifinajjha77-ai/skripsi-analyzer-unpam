// ─── Types ────────────────────────────────────────────────────────────────────

export interface IndicatorKnowledge {
  nama: string;
  definisi: string;
  bahasaSederhana: string;
  contoh: string;
  mengapa: string;
}

export interface ReferensiKnowledge {
  penulis: string;
  tahun: number;
  karya: string;
}

export interface VariableKnowledge {
  nama: string;
  kategori: "independen" | "dependen";
  emoji: string;
  definisi: string;
  definisiSederhana: string;
  mengapaDigunakan: string;
  contohObjek: string;
  referensi: ReferensiKnowledge[];
  indikator: IndicatorKnowledge[];
}

// ─── Knowledge Database ───────────────────────────────────────────────────────

const db: Record<string, VariableKnowledge> = {

  /* ─── Harga ───────────────────────────────────────────────────────────────── */
  Harga: {
    nama: "Harga",
    kategori: "independen",
    emoji: "💰",
    definisi: "Menurut Kotler & Armstrong (2016), harga adalah sejumlah uang yang ditagihkan atas suatu produk atau jasa, atau jumlah dari nilai yang ditukarkan para pelanggan untuk memperoleh manfaat dari memiliki atau menggunakan suatu produk atau jasa.",
    definisiSederhana: "Harga adalah berapa banyak uang yang harus dikeluarkan konsumen untuk mendapatkan suatu produk. Harga yang tepat membuat konsumen merasa bahwa uang yang mereka keluarkan sepadan dengan apa yang mereka dapatkan.",
    mengapaDigunakan: "Penelitian ini menggunakan harga sebagai variabel karena harga merupakan salah satu faktor utama yang dipertimbangkan konsumen sebelum melakukan pembelian. Ketika harga dianggap terlalu mahal, konsumen akan mencari alternatif lain. Sebaliknya, harga yang terjangkau dan sesuai kualitas dapat mendorong keputusan pembelian.",
    contohObjek: "Misalnya pada toko online, jika harga produk lebih murah dibanding kompetitor dengan kualitas yang sama, konsumen cenderung memilih toko tersebut. Harga yang disertai transparansi (tanpa biaya tersembunyi) juga meningkatkan kepercayaan konsumen.",
    referensi: [
      { penulis: "Kotler & Armstrong", tahun: 2016, karya: "Principles of Marketing" },
      { penulis: "Tjiptono", tahun: 2019, karya: "Strategi Pemasaran" },
      { penulis: "Stanton", tahun: 2012, karya: "Prinsip Pemasaran" },
    ],
    indikator: [
      { nama: "Keterjangkauan Harga", definisi: "Tingkat kesesuaian harga dengan kemampuan finansial konsumen.", bahasaSederhana: "Harga yang masuk akal dan bisa dijangkau oleh kantong konsumen.", contoh: "Konsumen berpendapatan menengah dapat membeli produk ini tanpa harus menabung lama.", mengapa: "Jika harga tidak terjangkau, konsumen akan otomatis mencoret produk dari daftar belanjanya." },
      { nama: "Daya Saing Harga", definisi: "Tingkat kompetitif harga produk dibanding produk sejenis dari kompetitor.", bahasaSederhana: "Harga produk ini lebih murah atau setara dengan produk yang sama dari merek lain.", contoh: "Produk A dijual Rp 50.000, produk B sejenis dijual Rp 75.000 — produk A lebih berdaya saing.", mengapa: "Konsumen selalu membandingkan harga sebelum membeli. Harga yang bersaing membuat produk lebih dipilih." },
      { nama: "Kesesuaian Harga Dengan Kualitas", definisi: "Persepsi konsumen bahwa harga yang dibayarkan sesuai dengan kualitas produk yang diterima.", bahasaSederhana: "Konsumen merasa 'worth it' — kualitas produk sebanding dengan harganya.", contoh: "Baju seharga Rp 200.000 yang tahan lama dan nyaman dipakai dianggap sesuai harga.", mengapa: "Ketika harga tidak sesuai kualitas, konsumen merasa tertipu dan tidak akan membeli lagi." },
      { nama: "Kesesuaian Harga Dengan Manfaat", definisi: "Persepsi konsumen bahwa manfaat yang diperoleh sebanding dengan harga yang dibayarkan.", bahasaSederhana: "Konsumen merasa bahwa apa yang mereka dapatkan (manfaat/nilai) setimpal dengan uang yang mereka bayarkan.", contoh: "Produk skincare seharga Rp 150.000 yang benar-benar membuat kulit lebih cerah dianggap bermanfaat.", mengapa: "Konsumen membeli produk untuk mendapatkan manfaat, bukan sekedar benda. Jika manfaat lebih besar dari harga, konsumen puas." },
    ],
  },

  /* ─── Promosi ─────────────────────────────────────────────────────────────── */
  Promosi: {
    nama: "Promosi",
    kategori: "independen",
    emoji: "📢",
    definisi: "Menurut Kotler (2012), promosi adalah aktivitas yang menyampaikan manfaat produk dan membujuk pelanggan untuk membelinya. Promosi merupakan salah satu unsur bauran pemasaran yang digunakan untuk memberitahukan, membujuk, dan mengingatkan pasar tentang produk.",
    definisiSederhana: "Promosi adalah segala usaha yang dilakukan perusahaan untuk memperkenalkan produknya agar lebih banyak orang tahu dan tertarik untuk membeli.",
    mengapaDigunakan: "Promosi dipilih sebagai variabel karena tanpa promosi, produk terbaik sekalipun tidak akan dikenal konsumen. Efektivitas promosi secara langsung berdampak pada kesadaran merek dan keputusan pembelian konsumen.",
    contohObjek: "Pada bisnis online, promosi melalui Instagram Story, flash sale, atau voucher diskon secara langsung mendorong konsumen untuk membeli saat itu juga.",
    referensi: [
      { penulis: "Kotler & Armstrong", tahun: 2016, karya: "Principles of Marketing" },
      { penulis: "Shimp", tahun: 2014, karya: "Komunikasi Pemasaran Terpadu" },
      { penulis: "Tjiptono", tahun: 2019, karya: "Strategi Pemasaran" },
    ],
    indikator: [
      { nama: "Pesan Promosi", definisi: "Isi dan cara penyampaian pesan promosi kepada konsumen.", bahasaSederhana: "Apa yang disampaikan dalam iklan atau promosi — apakah pesannya jelas, menarik, dan mudah dipahami.", contoh: "Iklan 'Beli 2 Gratis 1 Hari Ini Saja!' menyampaikan pesan yang jelas, urgentif, dan menarik.", mengapa: "Pesan yang membingungkan tidak akan mendorong konsumen untuk bertindak. Pesan yang kuat dan jelas meningkatkan efektivitas promosi." },
      { nama: "Media Promosi", definisi: "Saluran atau platform yang digunakan untuk menyampaikan pesan promosi.", bahasaSederhana: "Di mana promosi dilakukan — di TikTok, Instagram, WhatsApp, spanduk, atau media lain.", contoh: "Promosi via TikTok menjangkau konsumen muda, sementara promosi via WhatsApp lebih personal.", mengapa: "Memilih media yang tepat memastikan promosi dilihat oleh target konsumen yang benar." },
      { nama: "Waktu Promosi", definisi: "Ketepatan waktu pelaksanaan promosi dengan kebutuhan dan perilaku konsumen.", bahasaSederhana: "Apakah promosi dilakukan di saat yang tepat — misalnya saat hari gajian atau menjelang lebaran.", contoh: "Diskon baju lebaran yang dimulai 2 minggu sebelum Idul Fitri sangat tepat waktunya.", mengapa: "Promosi yang dilakukan saat konsumen sedang dalam mood membeli akan jauh lebih efektif." },
      { nama: "Frekuensi Promosi", definisi: "Seberapa sering promosi dilakukan kepada konsumen.", bahasaSederhana: "Seberapa rutin perusahaan mengingatkan konsumen tentang produknya.", contoh: "Promosi harian via Instagram Story membuat produk selalu ada di benak konsumen.", mengapa: "Promosi yang terlalu jarang membuat konsumen lupa. Namun terlalu sering juga bisa dianggap spam." },
    ],
  },

  /* ─── Kualitas Produk ─────────────────────────────────────────────────────── */
  "Kualitas Produk": {
    nama: "Kualitas Produk",
    kategori: "independen",
    emoji: "⭐",
    definisi: "Menurut Kotler & Armstrong (2016), kualitas produk adalah kemampuan suatu produk untuk melaksanakan fungsinya, meliputi keandalan, daya tahan, ketepatan, kemudahan penggunaan dan perbaikan, serta atribut bernilai lainnya.",
    definisiSederhana: "Kualitas produk adalah seberapa baik dan memuaskan suatu produk ketika digunakan — apakah produk itu awet, nyaman, bekerja sesuai harapan, dan terlihat bagus.",
    mengapaDigunakan: "Konsumen modern semakin kritis dan sadar kualitas. Produk dengan kualitas tinggi mendapat ulasan positif yang menarik pembeli baru, sementara produk berkualitas rendah cepat ditinggalkan meskipun harganya murah.",
    contohObjek: "Produk fashion berkualitas tinggi memiliki jahitan rapi, bahan tidak pudar, dan ukuran yang konsisten — hal ini mendorong konsumen untuk membeli lagi dan merekomendasikan ke teman.",
    referensi: [
      { penulis: "Kotler & Armstrong", tahun: 2016, karya: "Principles of Marketing" },
      { penulis: "Garvin", tahun: 2014, karya: "Managing Quality" },
      { penulis: "Tjiptono", tahun: 2019, karya: "Manajemen Pemasaran" },
    ],
    indikator: [
      { nama: "Kinerja Produk", definisi: "Kemampuan produk melaksanakan fungsi utamanya.", bahasaSederhana: "Apakah produk bekerja sesuai yang dijanjikan.", contoh: "Blender yang mampu menghancurkan es batu sesuai klaim dalam iklannya.", mengapa: "Kinerja adalah ekspektasi utama konsumen saat membeli. Jika tidak terpenuhi, konsumen kecewa." },
      { nama: "Daya Tahan Produk", definisi: "Seberapa lama produk dapat bertahan sebelum rusak atau perlu diganti.", bahasaSederhana: "Ketahanan produk — apakah awet atau cepat rusak.", contoh: "Sepatu yang masih bagus setelah dipakai 2 tahun menunjukkan daya tahan yang baik.", mengapa: "Konsumen tidak mau membeli produk yang cepat rusak karena berarti membuang uang." },
      { nama: "Keandalan Produk", definisi: "Konsistensi kinerja produk dari waktu ke waktu dan minimnya kerusakan.", bahasaSederhana: "Produk bekerja dengan baik setiap kali digunakan, tidak sering rewel atau bermasalah.", contoh: "Smartphone yang tidak pernah tiba-tiba hang atau restart sendiri.", mengapa: "Keandalan membangun kepercayaan. Produk yang sering bermasalah membuat frustasi." },
      { nama: "Estetika Produk", definisi: "Penampilan visual dan desain produk yang menarik secara estetika.", bahasaSederhana: "Tampilan produk yang bagus, menarik, dan membuat pengguna bangga.", contoh: "Produk dengan kemasan premium yang terlihat mewah di foto media sosial.", mengapa: "Di era visual seperti sekarang, tampilan produk memengaruhi keputusan pembelian sebelum produk dicoba." },
    ],
  },

  /* ─── Kualitas Pelayanan ──────────────────────────────────────────────────── */
  "Kualitas Pelayanan": {
    nama: "Kualitas Pelayanan",
    kategori: "independen",
    emoji: "🤝",
    definisi: "Menurut Parasuraman, Zeithaml, & Berry (1988), kualitas pelayanan adalah tingkat keunggulan yang diharapkan dan pengendalian atas tingkat keunggulan tersebut untuk memenuhi keinginan pelanggan. Model SERVQUAL mengukurnya melalui lima dimensi: Tangibles, Reliability, Responsiveness, Assurance, dan Empathy.",
    definisiSederhana: "Kualitas pelayanan adalah seberapa baik pengalaman konsumen saat berinteraksi dengan perusahaan — mulai dari kecepatan respons, keramahan, keahlian, hingga perhatian yang diberikan.",
    mengapaDigunakan: "Pelayanan yang baik membuat konsumen betah dan kembali lagi. Di era review online, satu pengalaman pelayanan buruk bisa menyebar luas dan merusak reputasi bisnis.",
    contohObjek: "Toko online yang cepat membalas chat, ramah merespons komplain, dan memproses pesanan dengan cepat akan mendapat bintang 5 dan pembeli setia.",
    referensi: [
      { penulis: "Parasuraman, Zeithaml & Berry", tahun: 1988, karya: "SERVQUAL Model" },
      { penulis: "Tjiptono", tahun: 2019, karya: "Service Management" },
      { penulis: "Kotler & Keller", tahun: 2016, karya: "Marketing Management" },
    ],
    indikator: [
      { nama: "Keandalan (Reliability)", definisi: "Kemampuan melaksanakan layanan yang dijanjikan secara akurat dan konsisten.", bahasaSederhana: "Pelayanan sesuai janji — jika bilang dikirim 2 hari, ya 2 hari.", contoh: "Pesanan sampai tepat waktu sesuai estimasi yang diberikan.", mengapa: "Ketidakandalan merusak kepercayaan dan membuat konsumen tidak mau kembali." },
      { nama: "Ketanggapan (Responsiveness)", definisi: "Kemauan untuk membantu pelanggan dan memberikan layanan yang cepat.", bahasaSederhana: "Seberapa cepat dan sigap karyawan atau tim layanan merespons.", contoh: "CS online yang membalas pertanyaan dalam 5 menit.", mengapa: "Konsumen tidak suka menunggu. Respons cepat meningkatkan kepuasan secara signifikan." },
      { nama: "Jaminan (Assurance)", definisi: "Pengetahuan, kesopanan, dan kemampuan menimbulkan kepercayaan dan keyakinan.", bahasaSederhana: "Konsumen merasa aman dan yakin ketika bertransaksi.", contoh: "Penjual yang bisa menjelaskan detail produk dengan meyakinkan.", mengapa: "Konsumen hanya mau membeli jika merasa aman. Jaminan mengurangi keraguan." },
      { nama: "Empati (Empathy)", definisi: "Perhatian individual yang tulus kepada pelanggan.", bahasaSederhana: "Karyawan yang benar-benar peduli dengan kebutuhan setiap pelanggan.", contoh: "CS yang mengingat nama pelanggan lama dan menanyakan apakah produk sebelumnya memuaskan.", mengapa: "Pelanggan ingin merasa dihargai, bukan sekadar angka transaksi." },
    ],
  },

  /* ─── Brand Image ─────────────────────────────────────────────────────────── */
  "Brand Image": {
    nama: "Brand Image",
    kategori: "independen",
    emoji: "🏆",
    definisi: "Menurut Kotler & Keller (2016), brand image adalah persepsi dan keyakinan yang dipegang oleh konsumen, seperti yang tercermin dalam asosiasi yang tersimpan dalam memori konsumen. Brand image terbentuk dari semua pengalaman dan informasi yang diterima konsumen tentang suatu merek.",
    definisiSederhana: "Brand image adalah 'kesan' yang muncul di pikiran konsumen saat mendengar nama suatu merek — apakah kesan itu positif, premium, terpercaya, atau justru buruk.",
    mengapaDigunakan: "Brand image yang kuat membuat konsumen memilih merek tersebut bahkan tanpa membandingkan harga. Merek dengan citra baik seperti Nike atau Apple bisa menjual produk dengan harga premium karena kepercayaan konsumen.",
    contohObjek: "Ketika nama suatu brand fashion lokal identik dengan 'kualitas bagus harga terjangkau', konsumen otomatis merekomendasikannya kepada teman tanpa perlu promosi berbayar.",
    referensi: [
      { penulis: "Kotler & Keller", tahun: 2016, karya: "Marketing Management" },
      { penulis: "Aaker", tahun: 2014, karya: "Building Strong Brands" },
      { penulis: "Keller", tahun: 2013, karya: "Strategic Brand Management" },
    ],
    indikator: [
      { nama: "Keunggulan Merek", definisi: "Persepsi merek sebagai yang terbaik dalam kategorinya.", bahasaSederhana: "Konsumen menganggap merek ini lebih baik dari merek lain.", contoh: "Konsumen mengatakan 'kalau mau beli sneaker berkualitas, pasti pilih merek ini'.", mengapa: "Merek yang dianggap unggul mendapat 'first choice' dari konsumen." },
      { nama: "Kekuatan Merek", definisi: "Seberapa kuat merek tertanam dalam ingatan konsumen.", bahasaSederhana: "Merek yang mudah diingat dan sering terpikirkan saat butuh produk tersebut.", contoh: "Saat butuh minuman energi, otomatis langsung teringat merek tertentu.", mengapa: "Merek yang kuat tidak perlu promosi terlalu keras karena konsumen sudah mengingatnya." },
      { nama: "Keunikan Merek", definisi: "Diferensiasi merek yang membedakannya dari kompetitor.", bahasaSederhana: "Ada sesuatu dari merek ini yang tidak dimiliki merek lain.", contoh: "Desain logo yang ikonik, warna brand yang khas, atau slogan yang mudah diingat.", mengapa: "Di pasar yang penuh persaingan, keunikan adalah senjata untuk menonjol." },
      { nama: "Kepercayaan Merek", definisi: "Keyakinan konsumen bahwa merek akan selalu memberikan produk/layanan yang baik.", bahasaSederhana: "Konsumen tidak ragu membeli karena merek ini sudah terbukti bisa dipercaya.", contoh: "Konsumen membeli produk baru dari merek ini tanpa banyak membaca review karena sudah percaya.", mengapa: "Kepercayaan adalah aset terbesar merek — lebih berharga dari iklan manapun." },
    ],
  },

  /* ─── Brand Awareness ─────────────────────────────────────────────────────── */
  "Brand Awareness": {
    nama: "Brand Awareness",
    kategori: "independen",
    emoji: "👁️",
    definisi: "Menurut Aaker (1991), brand awareness adalah kemampuan potensial konsumen untuk mengenali atau mengingat kembali bahwa suatu merek merupakan anggota dari kategori produk tertentu.",
    definisiSederhana: "Brand awareness adalah seberapa banyak orang yang tahu dan kenal suatu merek. Semakin banyak orang kenal, semakin tinggi brand awareness-nya.",
    mengapaDigunakan: "Orang tidak bisa membeli produk yang tidak mereka ketahui. Brand awareness adalah fondasi dari semua strategi pemasaran — tanpa orang mengenal merek, tidak ada yang akan membeli.",
    contohObjek: "Ketika konsumen di media sosial sudah pernah melihat nama brand dan logonya minimal 7 kali, mereka mulai merasa familiar dan lebih percaya untuk mencoba.",
    referensi: [
      { penulis: "Aaker", tahun: 1991, karya: "Managing Brand Equity" },
      { penulis: "Keller", tahun: 2013, karya: "Strategic Brand Management" },
      { penulis: "Durianto", tahun: 2014, karya: "Strategi Menaklukkan Pasar" },
    ],
    indikator: [
      { nama: "Brand Recognition", definisi: "Kemampuan konsumen mengenali merek dari elemen visualnya seperti logo, warna, atau kemasan.", bahasaSederhana: "Kenal merek hanya dari melihat logonya.", contoh: "Melihat logo apel digigit langsung tahu itu Apple.", mengapa: "Pengenalan visual adalah gerbang pertama konsumen mengenal merek." },
      { nama: "Brand Recall", definisi: "Kemampuan mengingat merek tanpa bantuan visual (unaided recall).", bahasaSederhana: "Merek yang langsung terpikirkan saat membutuhkan sesuatu.", contoh: "Saat haus, langsung teringat nama minuman tertentu.", mengapa: "Merek yang mudah diingat lebih sering dibeli secara impulsif." },
      { nama: "Top of Mind", definisi: "Merek yang disebutkan pertama kali saat ditanya tentang kategori produk tertentu.", bahasaSederhana: "Merek nomor satu di benak konsumen dalam kategorinya.", contoh: "Saat ditanya 'merek sepatu lari apa yang kamu tahu?', nama pertama yang disebut adalah merek X.", mengapa: "Top of mind berarti menjadi pilihan pertama saat konsumen ingin membeli." },
      { nama: "Brand Knowledge", definisi: "Tingkat pengetahuan konsumen tentang produk, nilai, dan keunggulan suatu merek.", bahasaSederhana: "Seberapa banyak yang konsumen tahu tentang merek tersebut.", contoh: "Konsumen tahu produk apa saja yang dijual, harganya berumur berapa, dan kelebihannya apa.", mengapa: "Pengetahuan mendalam tentang merek meningkatkan kepercayaan dan kemungkinan pembelian." },
    ],
  },

  /* ─── Social Media Marketing ──────────────────────────────────────────────── */
  "Social Media Marketing": {
    nama: "Social Media Marketing",
    kategori: "independen",
    emoji: "📱",
    definisi: "Menurut Gunelius (2011), social media marketing adalah bentuk pemasaran langsung atau tidak langsung yang digunakan untuk membangun kesadaran, pengakuan, ingatan, dan tindakan terhadap suatu merek, bisnis, produk, atau layanan menggunakan media sosial.",
    definisiSederhana: "Social media marketing adalah strategi pemasaran menggunakan platform seperti Instagram, TikTok, Twitter, dan Facebook untuk menjangkau dan mempengaruhi konsumen.",
    mengapaDigunakan: "Rata-rata orang Indonesia menghabiskan lebih dari 3 jam per hari di media sosial. Ini menjadikan media sosial sebagai tempat paling efektif untuk menjangkau konsumen potensial dengan biaya yang jauh lebih rendah dari iklan konvensional.",
    contohObjek: "Brand yang aktif posting konten menarik di TikTok dan Instagram setiap hari lebih mudah dikenal dan dipercaya konsumen dibanding yang jarang aktif di media sosial.",
    referensi: [
      { penulis: "Gunelius", tahun: 2011, karya: "30-Minute Social Media Marketing" },
      { penulis: "Kotler, Kartajaya & Setiawan", tahun: 2017, karya: "Marketing 4.0" },
      { penulis: "Tuten & Solomon", tahun: 2018, karya: "Social Media Marketing" },
    ],
    indikator: [
      { nama: "Konten Media Sosial", definisi: "Kualitas dan relevansi konten yang diunggah di platform media sosial.", bahasaSederhana: "Apakah postingan di media sosial menarik, informatif, dan relevan untuk konsumen.", contoh: "Reels tutorial pemakaian produk yang menghibur dan informatif.", mengapa: "Konten yang bagus disukai, dibagikan, dan dilihat jutaan orang secara gratis." },
      { nama: "Interaksi Media Sosial", definisi: "Tingkat keterlibatan dan respons brand dengan audiens di media sosial.", bahasaSederhana: "Seberapa aktif brand membalas komentar, DM, dan berinteraksi dengan followers.", contoh: "Brand yang rajin balas komentar dan mengadakan Q&A di Instagram Live.", mengapa: "Interaksi membangun hubungan emosional dengan konsumen yang membuat mereka loyal." },
      { nama: "Iklan Media Sosial", definisi: "Promosi berbayar (paid ads) yang ditampilkan di platform media sosial.", bahasaSederhana: "Iklan yang muncul di feed atau story karena brand membayar platform.", contoh: "Iklan di-target ke pengguna berusia 18-25 tahun yang tertarik dengan fashion.", mengapa: "Iklan berbayar menjangkau audiens yang belum mengenal brand secara organik." },
      { nama: "Jangkauan Media Sosial", definisi: "Luas dan beragamnya platform serta audiens yang dijangkau melalui media sosial.", bahasaSederhana: "Di berapa banyak platform brand hadir dan berapa banyak orang yang bisa dijangkau.", contoh: "Brand hadir di Instagram, TikTok, Shopee Feed, dan YouTube secara aktif.", mengapa: "Semakin luas jangkauan, semakin banyak calon konsumen yang bisa dijangkau." },
    ],
  },

  /* ─── Influencer Marketing ────────────────────────────────────────────────── */
  "Influencer Marketing": {
    nama: "Influencer Marketing",
    kategori: "independen",
    emoji: "🌟",
    definisi: "Menurut Kotler & Keller (2016), influencer marketing adalah strategi pemasaran yang melibatkan individu dengan pengaruh signifikan terhadap calon pembeli untuk mempromosikan produk atau layanan kepada para pengikut mereka.",
    definisiSederhana: "Influencer marketing adalah promosi produk menggunakan orang-orang yang punya banyak pengikut di media sosial — seperti YouTuber, selebgram, atau content creator TikTok — agar produk lebih dipercaya dan dikenal.",
    mengapaDigunakan: "Konsumen lebih percaya rekomendasi dari orang yang mereka ikuti dan kagumi daripada iklan biasa. Influencer yang tepat bisa menjangkau ribuan hingga jutaan calon konsumen yang relevan dalam satu konten.",
    contohObjek: "Brand yang menggunakan micro-influencer (10.000–50.000 followers) di bidang yang sesuai dengan produknya sering mendapat engagement yang lebih tinggi dibanding menggunakan selebrity besar.",
    referensi: [
      { penulis: "Kotler & Keller", tahun: 2016, karya: "Marketing Management" },
      { penulis: "Shimp", tahun: 2014, karya: "Integrated Marketing Communication" },
      { penulis: "Brown & Fiorella", tahun: 2013, karya: "Influence Marketing" },
    ],
    indikator: [
      { nama: "Kredibilitas Influencer", definisi: "Tingkat kepercayaan dan keahlian yang dimiliki influencer di mata pengikutnya.", bahasaSederhana: "Apakah influencer ini dipercaya dan dianggap ahli oleh pengikutnya.", contoh: "Dokter kecantikan yang juga aktif di Instagram lebih kredibel merekomendasikan produk skincare.", mengapa: "Konsumen hanya mendengarkan rekomendasi dari orang yang mereka percaya. Influencer yang tidak kredibel justru merusak citra produk." },
      { nama: "Kesesuaian Influencer", definisi: "Kesesuaian antara karakter/niche influencer dengan produk yang dipromosikan.", bahasaSederhana: "Influencer yang dipilih nyambung dengan jenis produk yang dipromosikan.", contoh: "Food blogger yang mempromosikan produk makanan lebih relevan daripada beauty influencer.", mengapa: "Mismatch antara influencer dan produk membuat promosi tidak efektif dan terkesan dipaksakan." },
      { nama: "Daya Tarik Influencer", definisi: "Kemampuan influencer menarik perhatian dan mempengaruhi keputusan pembelian pengikutnya.", bahasaSederhana: "Seberapa 'menarik' dan 'berpengaruh' influencer tersebut bagi pengikutnya.", contoh: "Influencer dengan gaya hidup aspirasional yang membuat pengikutnya ingin meniru.", mengapa: "Daya tarik influencer yang tinggi meningkatkan kemungkinan pengikutnya mencoba produk yang direkomendasikan." },
      { nama: "Konten Influencer", definisi: "Kualitas dan autentisitas konten yang dibuat influencer untuk mempromosikan produk.", bahasaSederhana: "Konten yang dibuat influencer harus kreatif, jujur, dan tidak terkesan iklan palsu.", contoh: "Influencer yang menunjukkan proses penggunaan produk secara nyata, bukan hanya foto cantik saja.", mengapa: "Konten yang autentik lebih dipercaya dan mendapat lebih banyak engagement dari pengikut." },
    ],
  },

  /* ─── Online Customer Review ──────────────────────────────────────────────── */
  "Online Customer Review": {
    nama: "Online Customer Review",
    kategori: "independen",
    emoji: "⭐",
    definisi: "Menurut Cheung & Thadani (2012), online customer review adalah evaluasi dan pendapat konsumen tentang produk atau layanan yang dipublikasikan secara online melalui platform e-commerce, media sosial, atau forum diskusi.",
    definisiSederhana: "Online customer review adalah ulasan dan penilaian yang ditulis oleh pembeli sebelumnya di internet — seperti bintang dan komentar di Shopee, Tokopedia, atau Google Maps.",
    mengapaDigunakan: "Lebih dari 90% konsumen membaca review online sebelum membeli. Review positif membangun kepercayaan calon pembeli, sementara review negatif bisa menghalangi penjualan.",
    contohObjek: "Produk dengan 500+ ulasan bintang 4-5 di marketplace jauh lebih laku dibanding produk serupa dengan sedikit atau tanpa ulasan.",
    referensi: [
      { penulis: "Cheung & Thadani", tahun: 2012, karya: "The Impact of Electronic Word-of-Mouth" },
      { penulis: "Kotler & Keller", tahun: 2016, karya: "Marketing Management" },
      { penulis: "Park & Kim", tahun: 2018, karya: "Consumer Online Review" },
    ],
    indikator: [
      { nama: "Kualitas Ulasan", definisi: "Tingkat kelengkapan, detail, dan kegunaan informasi dalam ulasan.", bahasaSederhana: "Apakah ulasan memberikan informasi yang berguna dan detail.", contoh: "Ulasan yang menyertakan foto produk asli, ukuran, dan pengalaman pemakaian selama 2 minggu.", mengapa: "Ulasan berkualitas membantu calon pembeli membuat keputusan yang lebih baik." },
      { nama: "Kredibilitas Ulasan", definisi: "Tingkat kepercayaan konsumen terhadap keaslian dan kejujuran ulasan.", bahasaSederhana: "Apakah ulasan ini asli dari pembeli nyata, bukan ulasan palsu.", contoh: "Ulasan dengan foto transaksi dan label 'Pembeli Terverifikasi' lebih dipercaya.", mengapa: "Ulasan yang tidak dipercaya tidak akan mempengaruhi keputusan pembelian." },
      { nama: "Kuantitas Ulasan", definisi: "Jumlah total ulasan yang diterima produk.", bahasaSederhana: "Semakin banyak ulasan, semakin terpercaya suatu produk.", contoh: "Produk dengan 1.000 ulasan lebih dipercaya daripada produk dengan 10 ulasan.", mengapa: "Jumlah ulasan yang banyak mengindikasikan produk sudah banyak terjual dan terbukti." },
      { nama: "Nilai Ulasan", definisi: "Rating atau skor yang diberikan konsumen secara numerik (misalnya bintang 1-5).", bahasaSederhana: "Nilai bintang rata-rata yang diperoleh produk dari semua pembeli.", contoh: "Rating 4.8/5.0 dari 500 ulasan sangat meyakinkan calon pembeli.", mengapa: "Rating yang tinggi adalah sinyal kuat bahwa produk memuaskan mayoritas pembeli." },
    ],
  },

  /* ─── Electronic Word Of Mouth ───────────────────────────────────────────── */
  "Electronic Word Of Mouth": {
    nama: "Electronic Word Of Mouth",
    kategori: "independen",
    emoji: "💬",
    definisi: "Menurut Thurau et al. (2004), electronic word of mouth (eWOM) adalah pernyataan positif atau negatif yang dibuat oleh konsumen aktual, potensial, atau mantan konsumen tentang suatu produk/layanan yang tersedia bagi banyak orang dan institusi melalui internet.",
    definisiSederhana: "eWOM adalah rekomendasi atau cerita dari mulut ke mulut yang terjadi di internet — seperti berbagi pengalaman di grup WhatsApp, komentar di media sosial, atau posting di forum online.",
    mengapaDigunakan: "Rekomendasi dari orang yang kita kenal atau komunitas yang kita percaya jauh lebih berpengaruh dari iklan manapun. eWOM yang positif bisa membuat produk viral secara organik.",
    contohObjek: "Ketika anggota komunitas online membagikan pengalaman positif menggunakan suatu produk di grup Facebook, anggota lain yang melihat cenderung ikut mencoba produk tersebut.",
    referensi: [
      { penulis: "Thurau et al.", tahun: 2004, karya: "Electronic Word-of-Mouth via Consumer-Opinion Platforms" },
      { penulis: "Kotler & Keller", tahun: 2016, karya: "Marketing Management" },
      { penulis: "Jalilvand & Samiei", tahun: 2012, karya: "The Effect of eWOM" },
    ],
    indikator: [
      { nama: "Intensitas eWOM", definisi: "Frekuensi dan banyaknya konten eWOM yang beredar tentang suatu produk.", bahasaSederhana: "Seberapa sering orang membicarakan produk ini di internet.", contoh: "Produk yang sering di-review di TikTok, sering muncul di kolom komentar Instagram brand lain.", mengapa: "Semakin sering dibicarakan, semakin banyak orang yang tahu dan penasaran dengan produk." },
      { nama: "Valency eWOM", definisi: "Nada atau sentimen (positif/negatif) dari konten eWOM yang beredar.", bahasaSederhana: "Apakah orang membicarakan produk ini dengan cara yang baik atau buruk.", contoh: "Komentar 'produk ini bagus banget, recommend!' vs 'jangan beli, kualitasnya jelek'.", mengapa: "eWOM positif mendorong pembelian, eWOM negatif justru menghalangi calon pembeli." },
      { nama: "Konten eWOM", definisi: "Informasi dan substansi yang terkandung dalam pesan eWOM.", bahasaSederhana: "Apa yang dibicarakan orang tentang produk ini di internet.", contoh: "Orang berbagi foto 'before-after' menggunakan produk skincare, atau video unboxing.", mengapa: "Konten yang informatif dan relevan membantu calon pembeli memahami nilai produk." },
      { nama: "Kredibilitas eWOM", definisi: "Tingkat kepercayaan terhadap sumber dan isi pesan eWOM.", bahasaSederhana: "Apakah ulasan online ini bisa dipercaya atau tidak.", contoh: "Review dari akun aktif dengan foto profil nyata lebih dipercaya daripada akun tanpa foto.", mengapa: "eWOM yang tidak dipercaya tidak akan mempengaruhi keputusan pembelian." },
    ],
  },

  /* ─── Kepercayaan ─────────────────────────────────────────────────────────── */
  Kepercayaan: {
    nama: "Kepercayaan",
    kategori: "independen",
    emoji: "🔒",
    definisi: "Menurut Morgan & Hunt (1994), kepercayaan adalah keyakinan bahwa pihak lain dapat diandalkan untuk memenuhi kewajibannya. Dalam konteks pemasaran, kepercayaan konsumen adalah keyakinan bahwa suatu merek/penjual akan memenuhi janjinya.",
    definisiSederhana: "Kepercayaan adalah keyakinan konsumen bahwa penjual atau brand ini jujur, kompeten, dan tidak akan mengecewakan mereka.",
    mengapaDigunakan: "Tanpa kepercayaan, tidak ada transaksi. Konsumen tidak akan membeli dari penjual yang tidak mereka percaya, terutama dalam transaksi online di mana mereka tidak bisa melihat produk langsung.",
    contohObjek: "Toko online yang memiliki banyak ulasan positif, merespons keluhan dengan cepat, dan memiliki kebijakan pengembalian barang yang jelas lebih mudah mendapat kepercayaan konsumen baru.",
    referensi: [
      { penulis: "Morgan & Hunt", tahun: 1994, karya: "The Commitment-Trust Theory" },
      { penulis: "Mayer, Davis & Schoorman", tahun: 1995, karya: "An Integrative Model of Trust" },
      { penulis: "Kotler & Keller", tahun: 2016, karya: "Marketing Management" },
    ],
    indikator: [
      { nama: "Kemampuan (Ability)", definisi: "Keyakinan bahwa pihak yang dipercaya memiliki kompetensi untuk memenuhi harapan.", bahasaSederhana: "Konsumen yakin bahwa penjual ini punya kemampuan untuk memenuhi apa yang dijanjikan.", contoh: "Toko dengan track record pengiriman tepat waktu 100% dalam 6 bulan terakhir.", mengapa: "Kemampuan adalah dasar kepercayaan — jika tidak mampu, tidak ada alasan untuk dipercaya." },
      { nama: "Kebaikan Hati (Benevolence)", definisi: "Keyakinan bahwa pihak yang dipercaya peduli terhadap kesejahteraan konsumen.", bahasaSederhana: "Konsumen yakin bahwa penjual ini benar-benar peduli dengan kepentingan mereka.", contoh: "Penjual yang proaktif menginformasikan keterlambatan pengiriman dan memberikan kompensasi.", mengapa: "Konsumen ingin merasa diperhatikan, bukan sekadar sebagai sumber uang." },
      { nama: "Integritas (Integrity)", definisi: "Keyakinan bahwa pihak yang dipercaya selalu jujur dan menepati janjinya.", bahasaSederhana: "Penjual yang selalu jujur dan tidak pernah menipu.", contoh: "Deskripsi produk yang akurat sesuai dengan produk yang diterima, tanpa foto yang diperbagus.", mengapa: "Sekali ketahuan tidak jujur, kepercayaan hilang selamanya dan reputasi rusak." },
      { nama: "Keyakinan (Predictability)", definisi: "Kemampuan memprediksi perilaku pihak yang dipercaya secara konsisten.", bahasaSederhana: "Penjual yang perilakunya konsisten dan bisa diprediksi — konsumen tahu apa yang akan mereka dapatkan.", contoh: "Setiap pesan selalu dibalas dalam 1 jam, produk selalu sesuai foto, kemasan selalu rapi.", mengapa: "Konsistensi membangun kepercayaan jangka panjang dan loyalitas pelanggan." },
    ],
  },

  /* ─── Diskon ──────────────────────────────────────────────────────────────── */
  Diskon: {
    nama: "Diskon",
    kategori: "independen",
    emoji: "🏷️",
    definisi: "Menurut Kotler & Armstrong (2016), diskon adalah pengurangan harga langsung dari harga resmi produk selama periode tertentu atau dalam kondisi tertentu. Diskon merupakan salah satu alat promosi harga yang paling umum digunakan.",
    definisiSederhana: "Diskon adalah potongan harga dari harga normal — misalnya produk yang biasanya Rp 100.000 dijual menjadi Rp 70.000 selama promo.",
    mengapaDigunakan: "Diskon menciptakan urgensi dan mendorong konsumen untuk segera membeli. Konsumen yang ragu pun bisa tergerak membeli saat melihat ada diskon karena khawatir kehabisan atau harga kembali normal.",
    contohObjek: "Flash sale dengan diskon 50% di Harbolnas membuat ribuan transaksi terjadi dalam hitungan jam karena konsumen tidak mau ketinggalan kesempatan.",
    referensi: [
      { penulis: "Kotler & Armstrong", tahun: 2016, karya: "Principles of Marketing" },
      { penulis: "Tjiptono", tahun: 2019, karya: "Strategi Pemasaran" },
      { penulis: "Swastha & Irawan", tahun: 2018, karya: "Manajemen Pemasaran Modern" },
    ],
    indikator: [
      { nama: "Besaran Diskon", definisi: "Persentase atau jumlah pengurangan harga dari harga normal.", bahasaSederhana: "Seberapa besar potongan harga yang diberikan.", contoh: "Diskon 30% lebih menarik daripada diskon 5%.", mengapa: "Semakin besar diskon, semakin kuat dorongan untuk segera membeli." },
      { nama: "Frekuensi Diskon", definisi: "Seberapa sering program diskon ditawarkan kepada konsumen.", bahasaSederhana: "Apakah diskon sering tersedia atau hanya sesekali.", contoh: "Weekly sale setiap Senin vs diskon setahun sekali.", mengapa: "Diskon yang rutin membuat konsumen sering mengunjungi toko dan melakukan pembelian berulang." },
      { nama: "Syarat Diskon", definisi: "Ketentuan dan persyaratan untuk mendapatkan diskon.", bahasaSederhana: "Apa yang harus dilakukan konsumen untuk mendapatkan diskon.", contoh: "Diskon untuk pembelian minimum Rp 100.000, atau diskon khusus member.", mengapa: "Syarat yang terlalu rumit justru mengurungkan niat konsumen untuk membeli." },
      { nama: "Daya Tarik Diskon", definisi: "Seberapa menarik dan meyakinkan penawaran diskon bagi konsumen.", bahasaSederhana: "Apakah tawaran diskon ini benar-benar menggiurkan dan mendorong pembelian.", contoh: "Diskon + gratis ongkir + hadiah senilai Rp 50.000 lebih menarik daripada sekadar diskon 10%.", mengapa: "Daya tarik diskon yang kuat menciptakan FOMO (Fear of Missing Out) yang mendorong pembelian impulsif." },
    ],
  },

  /* ─── Gratis Ongkir ───────────────────────────────────────────────────────── */
  "Gratis Ongkir": {
    nama: "Gratis Ongkir",
    kategori: "independen",
    emoji: "🚚",
    definisi: "Gratis ongkir (gratis ongkos kirim) adalah layanan di mana biaya pengiriman produk ditanggung oleh penjual atau platform e-commerce, sehingga konsumen tidak perlu membayar biaya pengiriman.",
    definisiSederhana: "Gratis ongkir berarti konsumen tidak perlu menambah biaya pengiriman saat belanja online — harga yang tertera sudah termasuk ongkos kirim.",
    mengapaDigunakan: "Biaya ongkir sering menjadi 'penghalang' terakhir sebelum konsumen menyelesaikan pembelian. Gratis ongkir menghilangkan hambatan ini dan meningkatkan tingkat konversi secara signifikan.",
    contohObjek: "Penelitian menunjukkan bahwa fitur gratis ongkir meningkatkan kemungkinan pembelian hingga 30%. Banyak konsumen membatalkan pembelian saat melihat biaya ongkir ditambahkan di akhir checkout.",
    referensi: [
      { penulis: "Kotler & Armstrong", tahun: 2016, karya: "Principles of Marketing" },
      { penulis: "Schiffman & Kanuk", tahun: 2019, karya: "Consumer Behavior" },
      { penulis: "Tjiptono", tahun: 2019, karya: "Strategi Pemasaran" },
    ],
    indikator: [
      { nama: "Ketersediaan Gratis Ongkir", definisi: "Tersedianya layanan gratis ongkir untuk produk yang dibeli.", bahasaSederhana: "Apakah layanan gratis ongkir tersedia untuk produk yang diinginkan konsumen.", contoh: "Produk di-tag 'Gratis Ongkir' di halaman produk marketplace.", mengapa: "Jika gratis ongkir tidak tersedia, konsumen mungkin memilih toko lain yang menawarkannya." },
      { nama: "Kemudahan Syarat", definisi: "Mudahnya syarat untuk mendapatkan gratis ongkir.", bahasaSederhana: "Apakah syarat untuk dapat gratis ongkir tidak rumit dan mudah dipenuhi.", contoh: "Gratis ongkir untuk semua produk vs gratis ongkir hanya jika belanja minimum Rp 500.000.", mengapa: "Syarat yang terlalu tinggi membuat gratis ongkir tidak relevan bagi mayoritas konsumen." },
      { nama: "Nilai Penghematan", definisi: "Besarnya penghematan finansial yang dirasakan konsumen dari gratis ongkir.", bahasaSederhana: "Seberapa besar uang yang dihemat konsumen karena tidak perlu bayar ongkir.", contoh: "Produk dikirim ke luar kota dengan ongkir normal Rp 25.000 — jika gratis, konsumen hemat Rp 25.000.", mengapa: "Penghematan yang terasa nyata lebih memotivasi pembelian daripada diskon produk yang kecil." },
      { nama: "Pengaruh Keputusan", definisi: "Seberapa besar gratis ongkir mempengaruhi keputusan pembelian konsumen.", bahasaSederhana: "Apakah konsumen memilih membeli karena ada gratis ongkir.", contoh: "Konsumen memilih platform A dibanding platform B semata karena platform A menawarkan gratis ongkir.", mengapa: "Jika gratis ongkir tidak mempengaruhi keputusan, berarti ada faktor lain yang lebih dominan yang perlu diteliti." },
    ],
  },

  /* ─── Keputusan Pembelian ─────────────────────────────────────────────────── */
  "Keputusan Pembelian": {
    nama: "Keputusan Pembelian",
    kategori: "dependen",
    emoji: "🛒",
    definisi: "Menurut Kotler & Armstrong (2016), keputusan pembelian adalah tahap proses keputusan di mana konsumen secara aktual melakukan pembelian produk. Proses ini diawali dari pengenalan masalah, pencarian informasi, evaluasi alternatif, keputusan pembelian, hingga perilaku pasca pembelian.",
    definisiSederhana: "Keputusan pembelian adalah proses akhir di mana konsumen memutuskan untuk membeli atau tidak membeli suatu produk setelah melalui berbagai pertimbangan.",
    mengapaDigunakan: "Keputusan pembelian adalah variabel dependen yang paling umum digunakan dalam penelitian pemasaran karena merupakan tujuan akhir dari seluruh strategi pemasaran — yaitu membuat konsumen membeli.",
    contohObjek: "Seorang konsumen memutuskan membeli produk setelah melihat review positif, harga yang terjangkau, dan ada promosi gratis ongkir — menunjukkan bahwa variabel-variabel ini berpengaruh terhadap keputusan pembelian.",
    referensi: [
      { penulis: "Kotler & Armstrong", tahun: 2016, karya: "Principles of Marketing" },
      { penulis: "Schiffman & Kanuk", tahun: 2019, karya: "Consumer Behavior" },
      { penulis: "Kotler & Keller", tahun: 2016, karya: "Marketing Management" },
    ],
    indikator: [
      { nama: "Pilihan Produk", definisi: "Keputusan konsumen dalam memilih produk mana yang akan dibeli dari berbagai alternatif.", bahasaSederhana: "Konsumen memilih produk ini di antara banyak produk lain yang tersedia.", contoh: "Dari 10 merek kaos yang tersedia, konsumen memilih merek X.", mengapa: "Pilihan produk mencerminkan apakah produk ini berhasil unggul di benak konsumen." },
      { nama: "Pilihan Merek", definisi: "Keputusan konsumen dalam memilih merek tertentu.", bahasaSederhana: "Konsumen secara sadar memilih merek ini, bukan merek lain.", contoh: "Konsumen memilih merek A bukan merek B meskipun harganya sama.", mengapa: "Pilihan merek menunjukkan loyalitas dan kepercayaan terhadap merek tersebut." },
      { nama: "Jumlah Pembelian", definisi: "Banyaknya unit produk yang dibeli konsumen dalam satu transaksi.", bahasaSederhana: "Apakah konsumen membeli banyak sekaligus atau hanya sedikit.", contoh: "Konsumen membeli 3 buah sekaligus karena ada diskon bundle.", mengapa: "Jumlah pembelian menunjukkan seberapa kuat keyakinan konsumen terhadap produk." },
      { nama: "Waktu Pembelian", definisi: "Kapan konsumen memutuskan untuk melakukan pembelian.", bahasaSederhana: "Apakah konsumen membeli segera atau menunda pembelian.", contoh: "Konsumen langsung checkout setelah melihat promo flash sale yang akan berakhir 2 jam lagi.", mengapa: "Waktu pembelian dipengaruhi oleh urgensi, promosi, dan faktor eksternal lainnya." },
    ],
  },

  /* ─── Minat Beli ──────────────────────────────────────────────────────────── */
  "Minat Beli": {
    nama: "Minat Beli",
    kategori: "dependen",
    emoji: "❤️",
    definisi: "Menurut Kotler & Keller (2016), minat beli adalah perilaku konsumen yang muncul sebagai respons terhadap objek yang menunjukkan keinginan pelanggan untuk melakukan pembelian. Minat beli merupakan tahap kecenderungan responden untuk bertindak sebelum keputusan membeli benar-benar dilaksanakan.",
    definisiSederhana: "Minat beli adalah keinginan atau ketertarikan konsumen untuk membeli suatu produk — belum tentu langsung beli, tapi sudah ada niat dan keinginan.",
    mengapaDigunakan: "Minat beli penting diteliti karena menjadi prediktor utama keputusan pembelian aktual. Meningkatkan minat beli adalah langkah pertama sebelum konsumen benar-benar membeli.",
    contohObjek: "Konsumen yang menambahkan produk ke wishlist atau keranjang belanja tapi belum checkout menunjukkan minat beli yang belum dikonversi menjadi pembelian.",
    referensi: [
      { penulis: "Kotler & Keller", tahun: 2016, karya: "Marketing Management" },
      { penulis: "Fishbein & Ajzen", tahun: 2015, karya: "Theory of Planned Behavior" },
      { penulis: "Schiffman & Kanuk", tahun: 2019, karya: "Consumer Behavior" },
    ],
    indikator: [
      { nama: "Minat Transaksional", definisi: "Kecenderungan untuk melakukan transaksi/pembelian nyata.", bahasaSederhana: "Konsumen benar-benar berniat untuk membeli.", contoh: "Konsumen sudah menentukan kapan akan membeli dan berapa budget yang disiapkan.", mengapa: "Minat transaksional adalah tahap paling dekat dengan pembelian aktual." },
      { nama: "Minat Referensial", definisi: "Kecenderungan untuk merekomendasikan produk kepada orang lain.", bahasaSederhana: "Konsumen ingin memberi tahu temannya tentang produk ini.", contoh: "Membagikan link produk ke grup WhatsApp keluarga.", mengapa: "Konsumen yang mau merekomendasikan adalah konsumen yang punya minat dan kepercayaan tinggi." },
      { nama: "Minat Preferensial", definisi: "Preferensi konsumen terhadap produk ini dibanding produk lain.", bahasaSederhana: "Konsumen lebih menyukai produk ini daripada produk alternatif.", contoh: "Ditanya 'kalau mau beli, pilih A atau B?', konsumen langsung jawab A.", mengapa: "Preferensi yang kuat berarti produk berhasil mengungguli kompetitor di benak konsumen." },
      { nama: "Minat Eksploratif", definisi: "Keinginan untuk mencari informasi lebih lanjut tentang produk.", bahasaSederhana: "Konsumen aktif mencari tahu lebih banyak tentang produk.", contoh: "Konsumen menonton semua review YouTube tentang produk sebelum memutuskan beli.", mengapa: "Konsumen yang mau mencari info lebih lanjut menunjukkan ketertarikan yang serius." },
    ],
  },

  /* ─── Kepuasan Konsumen ───────────────────────────────────────────────────── */
  "Kepuasan Konsumen": {
    nama: "Kepuasan Konsumen",
    kategori: "dependen",
    emoji: "😊",
    definisi: "Menurut Kotler & Keller (2016), kepuasan konsumen adalah perasaan senang atau kecewa seseorang yang muncul setelah membandingkan persepsi/kesan terhadap kinerja (hasil) suatu produk dan harapan-harapannya.",
    definisiSederhana: "Kepuasan konsumen adalah perasaan puas yang dirasakan setelah menggunakan suatu produk — apakah produk memenuhi atau bahkan melampaui harapan mereka.",
    mengapaDigunakan: "Konsumen yang puas akan kembali membeli (loyal) dan merekomendasikan produk ke orang lain. Konsumen yang tidak puas akan meninggalkan review negatif dan beralih ke kompetitor.",
    contohObjek: "Pelanggan yang menerima produk sesuai foto, dikemas dengan rapi, dan dikirim tepat waktu akan memberikan bintang 5 dan kembali berbelanja.",
    referensi: [
      { penulis: "Kotler & Keller", tahun: 2016, karya: "Marketing Management" },
      { penulis: "Oliver", tahun: 2014, karya: "Satisfaction: A Behavioral Perspective" },
      { penulis: "Zeithaml & Bitner", tahun: 2018, karya: "Services Marketing" },
    ],
    indikator: [
      { nama: "Kesesuaian Harapan", definisi: "Tingkat kesesuaian antara harapan konsumen dan kinerja aktual produk.", bahasaSederhana: "Apakah produk sesuai dengan apa yang konsumen bayangkan sebelumnya.", contoh: "Produk skincare yang benar-benar memutihkan kulit seperti yang dijanjikan dalam iklan.", mengapa: "Ketidaksesuaian harapan adalah sumber utama ketidakpuasan konsumen." },
      { nama: "Minat Berkunjung Kembali", definisi: "Keinginan konsumen untuk kembali berbelanja di tempat yang sama.", bahasaSederhana: "Konsumen mau beli lagi di toko yang sama di lain waktu.", contoh: "Konsumen yang sudah berlangganan dan selalu kembali setiap bulan.", mengapa: "Repeat customer jauh lebih menguntungkan daripada harus terus mencari pelanggan baru." },
      { nama: "Kesediaan Merekomendasikan", definisi: "Keinginan konsumen untuk merekomendasikan produk/toko kepada orang lain.", bahasaSederhana: "Konsumen mau memberitahu teman atau keluarganya tentang produk ini.", contoh: "Memposting ulasan positif di media sosial atau merekomendasikan di grup teman.", mengapa: "Word-of-mouth dari konsumen puas adalah promosi paling efektif dan gratis." },
    ],
  },

  /* ─── Loyalitas Konsumen ──────────────────────────────────────────────────── */
  "Loyalitas Konsumen": {
    nama: "Loyalitas Konsumen",
    kategori: "dependen",
    emoji: "💎",
    definisi: "Menurut Oliver (1999), loyalitas konsumen adalah komitmen yang mendalam untuk membeli kembali atau berlangganan suatu produk/layanan di masa depan meskipun ada pengaruh situasional dan usaha pemasaran yang berpotensi menyebabkan peralihan.",
    definisiSederhana: "Loyalitas adalah kondisi di mana konsumen terus memilih merek yang sama secara berulang-ulang, bahkan ketika ada merek lain yang menawarkan harga lebih murah atau promosi yang lebih menarik.",
    mengapaDigunakan: "Mempertahankan pelanggan lama jauh lebih murah daripada mendapatkan pelanggan baru. Pelanggan loyal juga menjadi 'brand ambassador' alami yang merekomendasikan produk kepada orang lain.",
    contohObjek: "Pelanggan yang selalu membeli dari toko yang sama selama bertahun-tahun, merekomendasikan ke teman, dan tidak tergoda pindah meskipun kompetitor menawarkan diskon.",
    referensi: [
      { penulis: "Oliver", tahun: 1999, karya: "Whence Consumer Loyalty" },
      { penulis: "Griffin", tahun: 2016, karya: "Customer Loyalty" },
      { penulis: "Kotler & Keller", tahun: 2016, karya: "Marketing Management" },
    ],
    indikator: [
      { nama: "Pembelian Ulang", definisi: "Perilaku konsumen yang melakukan pembelian kembali pada merek/toko yang sama.", bahasaSederhana: "Konsumen beli lagi dan lagi di tempat yang sama.", contoh: "Pelanggan yang order minimal sekali seminggu dari toko online favorit mereka.", mengapa: "Frekuensi pembelian ulang adalah indikator paling nyata dari loyalitas." },
      { nama: "Tidak Berpindah", definisi: "Kecenderungan konsumen untuk tetap setia pada satu merek meski ada alternatif lain.", bahasaSederhana: "Konsumen tidak mudah tergoda beralih ke merek atau toko lain.", contoh: "Konsumen menolak tawaran diskon dari kompetitor karena lebih percaya pada merek yang sudah biasa.", mengapa: "Konsumen yang tidak mudah berpindah adalah aset terbesar bisnis dalam jangka panjang." },
      { nama: "Rekomendasi", definisi: "Kesediaan konsumen untuk merekomendasikan produk kepada orang lain.", bahasaSederhana: "Konsumen secara aktif menyarankan orang lain untuk membeli produk ini.", contoh: "Membagikan kode referral ke teman atau membuat konten review positif.", mengapa: "Rekomendasi menghasilkan pelanggan baru tanpa biaya akuisisi tambahan." },
      { nama: "Komitmen", definisi: "Keterikatan emosional dan psikologis konsumen terhadap suatu merek.", bahasaSederhana: "Konsumen merasa benar-benar terikat dengan merek ini — bukan sekadar kebiasaan, tapi karena pilihan.", contoh: "Konsumen yang bangga menggunakan produk ini dan secara aktif membela merek jika ada kritik.", mengapa: "Komitmen emosional adalah tingkat loyalitas tertinggi yang sulit direbut kompetitor." },
    ],
  },
};

// ─── Exports ──────────────────────────────────────────────────────────────────

export function getVariableKnowledge(name: string): VariableKnowledge | undefined {
  return db[name];
}

export function getAllVariableKnowledge(): VariableKnowledge[] {
  return Object.values(db);
}

export function getIndependentKnowledge(): VariableKnowledge[] {
  return Object.values(db).filter((v) => v.kategori === "independen");
}

export function getDependentKnowledge(): VariableKnowledge[] {
  return Object.values(db).filter((v) => v.kategori === "dependen");
}

export const VARIABLE_KNOWLEDGE_DB = db;
