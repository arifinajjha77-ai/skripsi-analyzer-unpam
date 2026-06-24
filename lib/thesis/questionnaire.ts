export interface QuestionItem {
  no: number;
  indicator: string;
  statement: string;
}

export interface VariableQuestionnaire {
  variable: string;
  indicators: string[];
  items: QuestionItem[];
}

const db: Record<string, VariableQuestionnaire> = {
  Harga: {
    variable: "Harga",
    indicators: [
      "Keterjangkauan Harga",
      "Daya Saing Harga",
      "Kesesuaian Harga Dengan Kualitas",
      "Kesesuaian Harga Dengan Manfaat",
    ],
    items: [
      { no: 1, indicator: "Keterjangkauan Harga", statement: "Harga produk ini terjangkau bagi saya." },
      { no: 2, indicator: "Keterjangkauan Harga", statement: "Harga yang ditawarkan sesuai dengan kemampuan finansial saya." },
      { no: 3, indicator: "Daya Saing Harga", statement: "Harga produk ini lebih kompetitif dibanding produk sejenis." },
      { no: 4, indicator: "Daya Saing Harga", statement: "Harga produk ini bersaing dengan harga di tempat lain." },
      { no: 5, indicator: "Kesesuaian Harga Dengan Kualitas", statement: "Harga yang dibayarkan sesuai dengan kualitas produk yang didapat." },
      { no: 6, indicator: "Kesesuaian Harga Dengan Kualitas", statement: "Saya merasa harga produk ini sepadan dengan kualitasnya." },
      { no: 7, indicator: "Kesesuaian Harga Dengan Kualitas", statement: "Kualitas produk ini sebanding dengan harga yang ditawarkan." },
      { no: 8, indicator: "Kesesuaian Harga Dengan Manfaat", statement: "Harga produk ini sesuai dengan manfaat yang saya rasakan." },
      { no: 9, indicator: "Kesesuaian Harga Dengan Manfaat", statement: "Manfaat yang saya peroleh sebanding dengan harga yang saya bayarkan." },
      { no: 10, indicator: "Kesesuaian Harga Dengan Manfaat", statement: "Saya merasa puas dengan nilai yang saya dapatkan dari harga yang dibayar." },
    ],
  },

  Promosi: {
    variable: "Promosi",
    indicators: [
      "Pesan Promosi",
      "Media Promosi",
      "Waktu Promosi",
      "Frekuensi Promosi",
    ],
    items: [
      { no: 1, indicator: "Pesan Promosi", statement: "Pesan promosi yang disampaikan mudah dipahami." },
      { no: 2, indicator: "Pesan Promosi", statement: "Isi pesan promosi menarik perhatian saya." },
      { no: 3, indicator: "Pesan Promosi", statement: "Pesan promosi memberikan informasi yang jelas tentang produk." },
      { no: 4, indicator: "Media Promosi", statement: "Media yang digunakan untuk promosi mudah dijangkau oleh saya." },
      { no: 5, indicator: "Media Promosi", statement: "Promosi melalui media sosial membuat saya tertarik dengan produk." },
      { no: 6, indicator: "Waktu Promosi", statement: "Promosi dilakukan pada waktu yang tepat." },
      { no: 7, indicator: "Waktu Promosi", statement: "Penawaran promosi tersedia saat saya membutuhkan produk." },
      { no: 8, indicator: "Frekuensi Promosi", statement: "Promosi dilakukan secara rutin sehingga saya selalu mendapat informasi terbaru." },
      { no: 9, indicator: "Frekuensi Promosi", statement: "Frekuensi promosi cukup sering sehingga produk mudah diingat." },
      { no: 10, indicator: "Frekuensi Promosi", statement: "Intensitas promosi yang dilakukan membuat saya semakin tertarik membeli." },
    ],
  },

  "Kualitas Produk": {
    variable: "Kualitas Produk",
    indicators: [
      "Kinerja Produk",
      "Daya Tahan Produk",
      "Keandalan Produk",
      "Estetika Produk",
    ],
    items: [
      { no: 1, indicator: "Kinerja Produk", statement: "Produk ini bekerja sesuai dengan fungsi yang dijanjikan." },
      { no: 2, indicator: "Kinerja Produk", statement: "Produk ini memenuhi kebutuhan saya dengan baik." },
      { no: 3, indicator: "Kinerja Produk", statement: "Performa produk ini konsisten setiap kali digunakan." },
      { no: 4, indicator: "Daya Tahan Produk", statement: "Produk ini memiliki daya tahan yang baik." },
      { no: 5, indicator: "Daya Tahan Produk", statement: "Produk ini tidak mudah rusak dalam penggunaan normal." },
      { no: 6, indicator: "Keandalan Produk", statement: "Saya dapat mengandalkan produk ini untuk kebutuhan sehari-hari." },
      { no: 7, indicator: "Keandalan Produk", statement: "Produk ini jarang mengalami masalah atau kerusakan." },
      { no: 8, indicator: "Estetika Produk", statement: "Desain produk ini menarik secara visual." },
      { no: 9, indicator: "Estetika Produk", statement: "Kemasan produk ini terlihat menarik dan profesional." },
      { no: 10, indicator: "Estetika Produk", statement: "Penampilan produk ini membuat saya bangga menggunakannya." },
    ],
  },

  "Kualitas Pelayanan": {
    variable: "Kualitas Pelayanan",
    indicators: [
      "Keandalan (Reliability)",
      "Ketanggapan (Responsiveness)",
      "Jaminan (Assurance)",
      "Empati (Empathy)",
    ],
    items: [
      { no: 1, indicator: "Keandalan (Reliability)", statement: "Pelayanan yang diberikan sesuai dengan yang dijanjikan." },
      { no: 2, indicator: "Keandalan (Reliability)", statement: "Karyawan memberikan pelayanan secara akurat dan tepat waktu." },
      { no: 3, indicator: "Ketanggapan (Responsiveness)", statement: "Karyawan cepat dalam merespons pertanyaan atau keluhan saya." },
      { no: 4, indicator: "Ketanggapan (Responsiveness)", statement: "Karyawan selalu siap membantu pelanggan." },
      { no: 5, indicator: "Ketanggapan (Responsiveness)", statement: "Proses pelayanan dilakukan dengan cepat dan efisien." },
      { no: 6, indicator: "Jaminan (Assurance)", statement: "Karyawan memiliki pengetahuan yang cukup untuk menjawab pertanyaan saya." },
      { no: 7, indicator: "Jaminan (Assurance)", statement: "Saya merasa aman dan nyaman dalam bertransaksi." },
      { no: 8, indicator: "Empati (Empathy)", statement: "Karyawan memberikan perhatian yang tulus kepada pelanggan." },
      { no: 9, indicator: "Empati (Empathy)", statement: "Karyawan memahami kebutuhan spesifik saya." },
      { no: 10, indicator: "Empati (Empathy)", statement: "Pelayanan diberikan tanpa membeda-bedakan pelanggan." },
    ],
  },

  "Brand Image": {
    variable: "Brand Image",
    indicators: [
      "Keunggulan Merek",
      "Kekuatan Merek",
      "Keunikan Merek",
      "Kepercayaan Merek",
    ],
    items: [
      { no: 1, indicator: "Keunggulan Merek", statement: "Merek ini memiliki reputasi yang baik di masyarakat." },
      { no: 2, indicator: "Keunggulan Merek", statement: "Merek ini dikenal sebagai yang terbaik di kelasnya." },
      { no: 3, indicator: "Kekuatan Merek", statement: "Merek ini memiliki posisi yang kuat di benak saya." },
      { no: 4, indicator: "Kekuatan Merek", statement: "Merek ini mudah diingat dan dikenal banyak orang." },
      { no: 5, indicator: "Kekuatan Merek", statement: "Merek ini sering saya lihat dan dengar di berbagai media." },
      { no: 6, indicator: "Keunikan Merek", statement: "Merek ini memiliki ciri khas yang membedakannya dari merek lain." },
      { no: 7, indicator: "Keunikan Merek", statement: "Merek ini menawarkan sesuatu yang unik dan tidak dimiliki merek lain." },
      { no: 8, indicator: "Kepercayaan Merek", statement: "Saya percaya pada merek ini untuk memberikan produk berkualitas." },
      { no: 9, indicator: "Kepercayaan Merek", statement: "Merek ini konsisten dalam menjaga kualitas produk/layanannya." },
      { no: 10, indicator: "Kepercayaan Merek", statement: "Saya merasa bangga menggunakan produk dari merek ini." },
    ],
  },

  "Brand Awareness": {
    variable: "Brand Awareness",
    indicators: [
      "Brand Recognition",
      "Brand Recall",
      "Top of Mind",
      "Brand Knowledge",
    ],
    items: [
      { no: 1, indicator: "Brand Recognition", statement: "Saya dapat mengenali merek ini hanya dari logo atau warnanya." },
      { no: 2, indicator: "Brand Recognition", statement: "Saya mudah membedakan merek ini dari merek lainnya." },
      { no: 3, indicator: "Brand Recall", statement: "Saya dapat mengingat merek ini tanpa harus melihat produknya." },
      { no: 4, indicator: "Brand Recall", statement: "Merek ini langsung teringat saat saya membutuhkan produk sejenisnya." },
      { no: 5, indicator: "Top of Mind", statement: "Merek ini adalah yang pertama saya pikirkan dalam kategori produknya." },
      { no: 6, indicator: "Top of Mind", statement: "Merek ini selalu menjadi pilihan utama saya." },
      { no: 7, indicator: "Brand Knowledge", statement: "Saya mengetahui produk-produk yang ditawarkan merek ini." },
      { no: 8, indicator: "Brand Knowledge", statement: "Saya memiliki pengetahuan yang cukup tentang merek ini." },
      { no: 9, indicator: "Brand Knowledge", statement: "Saya memahami keunggulan yang dimiliki merek ini." },
      { no: 10, indicator: "Brand Knowledge", statement: "Saya sering mendapatkan informasi terbaru tentang merek ini." },
    ],
  },

  "Social Media Marketing": {
    variable: "Social Media Marketing",
    indicators: [
      "Konten Media Sosial",
      "Interaksi Media Sosial",
      "Iklan Media Sosial",
      "Jangkauan Media Sosial",
    ],
    items: [
      { no: 1, indicator: "Konten Media Sosial", statement: "Konten yang diunggah di media sosial menarik dan informatif." },
      { no: 2, indicator: "Konten Media Sosial", statement: "Konten media sosial produk ini mempengaruhi keputusan saya." },
      { no: 3, indicator: "Konten Media Sosial", statement: "Postingan di media sosial membuat saya lebih mengenal produk ini." },
      { no: 4, indicator: "Interaksi Media Sosial", statement: "Akun media sosial ini aktif merespons komentar pelanggan." },
      { no: 5, indicator: "Interaksi Media Sosial", statement: "Saya sering berinteraksi (like, komentar, share) dengan konten produk ini." },
      { no: 6, indicator: "Iklan Media Sosial", statement: "Iklan di media sosial membuat saya tertarik dengan produk ini." },
      { no: 7, indicator: "Iklan Media Sosial", statement: "Iklan produk ini di media sosial tampil menarik dan kreatif." },
      { no: 8, indicator: "Jangkauan Media Sosial", statement: "Saya mudah menemukan informasi produk ini di berbagai platform media sosial." },
      { no: 9, indicator: "Jangkauan Media Sosial", statement: "Produk ini aktif di berbagai platform media sosial yang saya gunakan." },
      { no: 10, indicator: "Jangkauan Media Sosial", statement: "Media sosial merupakan cara efektif bagi saya untuk mengetahui produk ini." },
    ],
  },

  "Influencer Marketing": {
    variable: "Influencer Marketing",
    indicators: [
      "Kredibilitas Influencer",
      "Kesesuaian Influencer",
      "Daya Tarik Influencer",
      "Konten Influencer",
    ],
    items: [
      { no: 1, indicator: "Kredibilitas Influencer", statement: "Influencer yang mempromosikan produk ini dapat dipercaya." },
      { no: 2, indicator: "Kredibilitas Influencer", statement: "Influencer memiliki keahlian yang relevan dengan produk yang dipromosikan." },
      { no: 3, indicator: "Kesesuaian Influencer", statement: "Influencer yang digunakan sesuai dengan citra produk ini." },
      { no: 4, indicator: "Kesesuaian Influencer", statement: "Influencer yang dipilih mencerminkan target konsumen produk ini." },
      { no: 5, indicator: "Daya Tarik Influencer", statement: "Influencer yang mempromosikan produk ini memiliki daya tarik yang kuat." },
      { no: 6, indicator: "Daya Tarik Influencer", statement: "Saya tertarik membeli produk karena influencer yang mempromosikannya." },
      { no: 7, indicator: "Konten Influencer", statement: "Konten yang dibuat influencer tentang produk ini informatif dan menarik." },
      { no: 8, indicator: "Konten Influencer", statement: "Ulasan influencer tentang produk ini jujur dan dapat dipercaya." },
      { no: 9, indicator: "Konten Influencer", statement: "Konten influencer membuat saya ingin mencoba produk ini." },
      { no: 10, indicator: "Konten Influencer", statement: "Saya mengikuti rekomendasi influencer dalam memilih produk." },
    ],
  },

  "Online Customer Review": {
    variable: "Online Customer Review",
    indicators: [
      "Kualitas Ulasan",
      "Kredibilitas Ulasan",
      "Kuantitas Ulasan",
      "Nilai Ulasan",
    ],
    items: [
      { no: 1, indicator: "Kualitas Ulasan", statement: "Ulasan pelanggan online memberikan informasi yang lengkap tentang produk." },
      { no: 2, indicator: "Kualitas Ulasan", statement: "Ulasan yang tersedia mudah dipahami dan membantu saya dalam memilih produk." },
      { no: 3, indicator: "Kredibilitas Ulasan", statement: "Saya mempercayai ulasan pelanggan yang ada di platform online." },
      { no: 4, indicator: "Kredibilitas Ulasan", statement: "Ulasan pelanggan tampak jujur dan tidak dibuat-buat." },
      { no: 5, indicator: "Kuantitas Ulasan", statement: "Banyaknya ulasan positif membuat saya lebih yakin membeli produk ini." },
      { no: 6, indicator: "Kuantitas Ulasan", statement: "Jumlah ulasan yang banyak menunjukkan produk ini banyak diminati." },
      { no: 7, indicator: "Nilai Ulasan", statement: "Rating bintang yang tinggi membuat saya tertarik dengan produk ini." },
      { no: 8, indicator: "Nilai Ulasan", statement: "Ulasan positif dari pelanggan lain mempengaruhi keputusan pembelian saya." },
      { no: 9, indicator: "Nilai Ulasan", statement: "Saya membaca ulasan pelanggan sebelum memutuskan untuk membeli." },
      { no: 10, indicator: "Nilai Ulasan", statement: "Ulasan produk online sangat membantu saya dalam memilih produk terbaik." },
    ],
  },

  "Electronic Word Of Mouth": {
    variable: "Electronic Word Of Mouth",
    indicators: [
      "Intensitas eWOM",
      "Valency eWOM",
      "Konten eWOM",
      "Kredibilitas eWOM",
    ],
    items: [
      { no: 1, indicator: "Intensitas eWOM", statement: "Saya sering melihat komentar dan ulasan tentang produk ini di internet." },
      { no: 2, indicator: "Intensitas eWOM", statement: "Banyak orang merekomendasikan produk ini secara online." },
      { no: 3, indicator: "Valency eWOM", statement: "Komentar positif tentang produk ini di internet mempengaruhi saya." },
      { no: 4, indicator: "Valency eWOM", statement: "Pendapat baik dari pengguna online membuat saya ingin membeli produk ini." },
      { no: 5, indicator: "Konten eWOM", statement: "Informasi yang dibagikan orang lain secara online tentang produk ini berguna bagi saya." },
      { no: 6, indicator: "Konten eWOM", statement: "Saya mendapatkan informasi yang bermanfaat tentang produk ini dari komunitas online." },
      { no: 7, indicator: "Konten eWOM", statement: "Diskusi online tentang produk ini membantu saya membuat keputusan pembelian." },
      { no: 8, indicator: "Kredibilitas eWOM", statement: "Saya percaya pada ulasan dan rekomendasi yang diberikan pengguna online." },
      { no: 9, indicator: "Kredibilitas eWOM", statement: "Pendapat orang lain secara online dapat saya jadikan referensi sebelum membeli." },
      { no: 10, indicator: "Kredibilitas eWOM", statement: "Rekomendasi dari komunitas online lebih saya percaya daripada iklan resmi." },
    ],
  },

  Kepercayaan: {
    variable: "Kepercayaan",
    indicators: [
      "Kemampuan (Ability)",
      "Kebaikan Hati (Benevolence)",
      "Integritas (Integrity)",
      "Keyakinan (Predictability)",
    ],
    items: [
      { no: 1, indicator: "Kemampuan (Ability)", statement: "Saya percaya produk/layanan ini mampu memenuhi kebutuhan saya." },
      { no: 2, indicator: "Kemampuan (Ability)", statement: "Penyedia produk/layanan ini memiliki kemampuan yang kompeten." },
      { no: 3, indicator: "Kebaikan Hati (Benevolence)", statement: "Penyedia selalu mengutamakan kepentingan dan kepuasan pelanggan." },
      { no: 4, indicator: "Kebaikan Hati (Benevolence)", statement: "Saya yakin penyedia ini peduli terhadap keluhan pelanggan." },
      { no: 5, indicator: "Kebaikan Hati (Benevolence)", statement: "Saya merasa penyedia ini bertindak demi kebaikan pelanggannya." },
      { no: 6, indicator: "Integritas (Integrity)", statement: "Informasi yang diberikan oleh penyedia selalu jujur dan akurat." },
      { no: 7, indicator: "Integritas (Integrity)", statement: "Penyedia menepati setiap janji yang diberikan kepada pelanggan." },
      { no: 8, indicator: "Keyakinan (Predictability)", statement: "Saya dapat memprediksi perilaku dan respons dari penyedia ini." },
      { no: 9, indicator: "Keyakinan (Predictability)", statement: "Penyedia ini konsisten dalam memberikan pelayanan yang baik." },
      { no: 10, indicator: "Keyakinan (Predictability)", statement: "Saya tidak ragu menggunakan layanan ini karena sudah terbukti terpercaya." },
    ],
  },

  Diskon: {
    variable: "Diskon",
    indicators: [
      "Besaran Diskon",
      "Frekuensi Diskon",
      "Syarat Diskon",
      "Daya Tarik Diskon",
    ],
    items: [
      { no: 1, indicator: "Besaran Diskon", statement: "Besaran diskon yang diberikan cukup signifikan bagi saya." },
      { no: 2, indicator: "Besaran Diskon", statement: "Persentase diskon yang ditawarkan membuat harga menjadi lebih terjangkau." },
      { no: 3, indicator: "Frekuensi Diskon", statement: "Diskon diberikan cukup sering sehingga saya dapat memanfaatkannya." },
      { no: 4, indicator: "Frekuensi Diskon", statement: "Penawaran diskon rutin membuat saya terus memantau produk ini." },
      { no: 5, indicator: "Syarat Diskon", statement: "Syarat untuk mendapatkan diskon mudah dipenuhi." },
      { no: 6, indicator: "Syarat Diskon", statement: "Ketentuan diskon yang berlaku tidak membingungkan saya." },
      { no: 7, indicator: "Daya Tarik Diskon", statement: "Penawaran diskon membuat saya tertarik untuk membeli produk ini." },
      { no: 8, indicator: "Daya Tarik Diskon", statement: "Diskon yang ditawarkan mendorong saya untuk segera melakukan pembelian." },
      { no: 9, indicator: "Daya Tarik Diskon", statement: "Diskon membuat nilai pembelian terasa lebih menguntungkan bagi saya." },
      { no: 10, indicator: "Daya Tarik Diskon", statement: "Saya cenderung memilih produk ini karena adanya penawaran diskon." },
    ],
  },

  "Gratis Ongkir": {
    variable: "Gratis Ongkir",
    indicators: [
      "Ketersediaan Gratis Ongkir",
      "Kemudahan Syarat",
      "Nilai Penghematan",
      "Pengaruh Keputusan",
    ],
    items: [
      { no: 1, indicator: "Ketersediaan Gratis Ongkir", statement: "Layanan gratis ongkir tersedia untuk produk yang ingin saya beli." },
      { no: 2, indicator: "Ketersediaan Gratis Ongkir", statement: "Saya mudah menemukan produk dengan penawaran gratis ongkir." },
      { no: 3, indicator: "Kemudahan Syarat", statement: "Syarat untuk mendapatkan gratis ongkir mudah dipenuhi." },
      { no: 4, indicator: "Kemudahan Syarat", statement: "Tidak ada ketentuan yang rumit untuk menikmati fasilitas gratis ongkir." },
      { no: 5, indicator: "Kemudahan Syarat", statement: "Minimum pembelian untuk gratis ongkir terasa wajar bagi saya." },
      { no: 6, indicator: "Nilai Penghematan", statement: "Gratis ongkir membuat total belanja saya terasa lebih hemat." },
      { no: 7, indicator: "Nilai Penghematan", statement: "Penghematan biaya pengiriman membuat harga produk menjadi lebih kompetitif." },
      { no: 8, indicator: "Pengaruh Keputusan", statement: "Adanya gratis ongkir mendorong saya untuk membeli lebih banyak produk." },
      { no: 9, indicator: "Pengaruh Keputusan", statement: "Saya cenderung memilih toko yang menawarkan gratis ongkir." },
      { no: 10, indicator: "Pengaruh Keputusan", statement: "Gratis ongkir menjadi pertimbangan utama saya dalam memilih tempat belanja." },
    ],
  },

  // ─── DEPENDENT VARIABLES ──────────────────────────────────────────────────

  "Keputusan Pembelian": {
    variable: "Keputusan Pembelian",
    indicators: [
      "Pilihan Produk",
      "Pilihan Merek",
      "Jumlah Pembelian",
      "Waktu Pembelian",
    ],
    items: [
      { no: 1, indicator: "Pilihan Produk", statement: "Saya memilih produk ini karena sesuai dengan kebutuhan saya." },
      { no: 2, indicator: "Pilihan Produk", statement: "Saya memilih produk ini setelah mempertimbangkan berbagai alternatif." },
      { no: 3, indicator: "Pilihan Produk", statement: "Produk ini adalah pilihan terbaik yang tersedia di pasaran menurut saya." },
      { no: 4, indicator: "Pilihan Merek", statement: "Saya memilih merek ini karena sudah percaya dengan kualitasnya." },
      { no: 5, indicator: "Pilihan Merek", statement: "Merek ini menjadi prioritas utama saya saat berbelanja." },
      { no: 6, indicator: "Jumlah Pembelian", statement: "Saya membeli produk ini dalam jumlah yang sesuai kebutuhan saya." },
      { no: 7, indicator: "Jumlah Pembelian", statement: "Saya mempertimbangkan jumlah pembelian berdasarkan anggaran yang tersedia." },
      { no: 8, indicator: "Waktu Pembelian", statement: "Saya membeli produk ini pada waktu yang tepat sesuai kebutuhan." },
      { no: 9, indicator: "Waktu Pembelian", statement: "Saya segera melakukan pembelian ketika ada penawaran yang menarik." },
      { no: 10, indicator: "Waktu Pembelian", statement: "Saya tidak menunda-nunda untuk membeli produk yang sudah saya tentukan." },
    ],
  },

  "Minat Beli": {
    variable: "Minat Beli",
    indicators: [
      "Minat Transaksional",
      "Minat Referensial",
      "Minat Preferensial",
      "Minat Eksploratif",
    ],
    items: [
      { no: 1, indicator: "Minat Transaksional", statement: "Saya berminat untuk membeli produk ini dalam waktu dekat." },
      { no: 2, indicator: "Minat Transaksional", statement: "Saya sudah berencana untuk melakukan pembelian produk ini." },
      { no: 3, indicator: "Minat Transaksional", statement: "Saya akan segera membeli produk ini jika ada kesempatan." },
      { no: 4, indicator: "Minat Referensial", statement: "Saya akan merekomendasikan produk ini kepada orang-orang terdekat saya." },
      { no: 5, indicator: "Minat Referensial", statement: "Saya bersedia berbagi pengalaman positif tentang produk ini." },
      { no: 6, indicator: "Minat Preferensial", statement: "Produk ini menjadi prioritas pilihan saya dibanding produk lain." },
      { no: 7, indicator: "Minat Preferensial", statement: "Saya lebih memilih produk ini dibandingkan produk kompetitor." },
      { no: 8, indicator: "Minat Eksploratif", statement: "Saya aktif mencari informasi lebih lanjut tentang produk ini." },
      { no: 9, indicator: "Minat Eksploratif", statement: "Saya sering mencari tahu perkembangan terbaru dari produk ini." },
      { no: 10, indicator: "Minat Eksploratif", statement: "Rasa ingin tahu saya mendorong untuk mengenal produk ini lebih dalam." },
    ],
  },

  "Kepuasan Konsumen": {
    variable: "Kepuasan Konsumen",
    indicators: [
      "Kesesuaian Harapan",
      "Minat Berkunjung Kembali",
      "Kesediaan Merekomendasikan",
    ],
    items: [
      { no: 1, indicator: "Kesesuaian Harapan", statement: "Produk yang saya terima sesuai dengan harapan saya sebelum membeli." },
      { no: 2, indicator: "Kesesuaian Harapan", statement: "Kualitas produk/layanan melebihi ekspektasi saya." },
      { no: 3, indicator: "Kesesuaian Harapan", statement: "Manfaat yang saya dapatkan sesuai dengan yang dijanjikan." },
      { no: 4, indicator: "Kesesuaian Harapan", statement: "Saya merasa puas dengan keseluruhan pengalaman berbelanja ini." },
      { no: 5, indicator: "Minat Berkunjung Kembali", statement: "Saya akan kembali membeli di tempat ini di masa mendatang." },
      { no: 6, indicator: "Minat Berkunjung Kembali", statement: "Saya berencana untuk melakukan pembelian ulang secara berkala." },
      { no: 7, indicator: "Minat Berkunjung Kembali", statement: "Kepuasan yang saya rasakan mendorong saya untuk berbelanja kembali." },
      { no: 8, indicator: "Kesediaan Merekomendasikan", statement: "Saya bersedia merekomendasikan produk/toko ini kepada keluarga atau teman." },
      { no: 9, indicator: "Kesediaan Merekomendasikan", statement: "Saya akan memberikan ulasan positif tentang produk ini secara online." },
      { no: 10, indicator: "Kesediaan Merekomendasikan", statement: "Saya bangga menjadi pelanggan dan merekomendasikannya kepada orang lain." },
    ],
  },

  "Loyalitas Konsumen": {
    variable: "Loyalitas Konsumen",
    indicators: [
      "Pembelian Ulang",
      "Tidak Berpindah",
      "Rekomendasi",
      "Komitmen",
    ],
    items: [
      { no: 1, indicator: "Pembelian Ulang", statement: "Saya secara rutin melakukan pembelian ulang pada produk/toko ini." },
      { no: 2, indicator: "Pembelian Ulang", statement: "Produk/toko ini menjadi langganan tetap saya." },
      { no: 3, indicator: "Pembelian Ulang", statement: "Saya akan terus membeli produk ini meskipun ada penawaran dari tempat lain." },
      { no: 4, indicator: "Tidak Berpindah", statement: "Saya tidak akan beralih ke produk/toko lain meskipun ada tawaran yang serupa." },
      { no: 5, indicator: "Tidak Berpindah", statement: "Saya tetap setia menggunakan produk ini meskipun harganya naik." },
      { no: 6, indicator: "Tidak Berpindah", statement: "Saya tidak tertarik untuk mencoba produk dari kompetitor." },
      { no: 7, indicator: "Rekomendasi", statement: "Saya aktif menceritakan pengalaman positif saya kepada orang lain." },
      { no: 8, indicator: "Rekomendasi", statement: "Saya sering merekomendasikan produk/toko ini kepada teman dan keluarga." },
      { no: 9, indicator: "Komitmen", statement: "Saya berkomitmen untuk terus menjadi pelanggan setia di sini." },
      { no: 10, indicator: "Komitmen", statement: "Saya merasa memiliki ikatan emosional yang kuat dengan merek/toko ini." },
    ],
  },
};

export function getQuestionnaire(variableName: string): VariableQuestionnaire | null {
  return db[variableName] ?? null;
}

export function getAllVariableNames(): string[] {
  return Object.keys(db);
}

export default db;
