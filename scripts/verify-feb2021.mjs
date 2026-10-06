import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import JSZip from 'jszip';
import { xml2js } from 'xml-js';
import { exportAssignmentDocx } from '../lib/assignment/exportDocx.ts';
import { exportMakalahEngineDocx } from '../lib/makalah-engine/exportDocx.ts';
import { exportMakalahDocx } from '../lib/makalah/docxExport.ts';
import { generateBab1Docx } from '../lib/thesis/bab1DocxExport.ts';
import { generateBab4Docx } from '../lib/narasi/docxExport.ts';
import { generateKarakteristikDocx } from '../lib/responden/karakteristikDocx.ts';
import { generateOperasionalDocx } from '../lib/thesis/operasionalDocx.ts';
import { generateDocx } from '../lib/thesis/docxExport.ts';
import { generateInsightDocx } from '../lib/kelayakan/docxExport.ts';
import { generateBab4Enhanced } from '../lib/narratives/generator.ts';
import { buildSalesTable } from '../lib/thesis/bab1Generator.ts';
import { getCitationFor, getBab1References } from '../lib/bab1-engine/authorMapping.ts';
import { defaultBab1State } from '../lib/thesis/bab1Store.ts';
import { defaultMakalahState } from '../lib/makalah/store.ts';
import { getQuestionnaire } from '../lib/thesis/questionnaire.ts';
import { REFERENCE_DB } from '../lib/reference-engine/database.ts';
import { validateReference } from '../lib/reference/referenceValidator.ts';
import { formatAPA } from '../lib/reference/bibliographyBuilder.ts';
import { generateOutline } from '../lib/makalah-engine/planner.ts';
import { normalizeInput } from '../lib/makalah-engine/prompts.ts';
import { inferFebProfile, referenceAgeWarnings, febThesisOutline } from '../lib/templates/feb2021.ts';

const outputDir = process.env.FEB_TEST_OUTPUT || '/tmp/skripsi-feb-2021-evidence';
await fs.mkdir(outputDir, { recursive: true });
const all = (node, name) => [...(node.name === name ? [node] : []), ...(node.elements || []).flatMap(child => all(child, name))];
const plainText = node => all(node, 'w:t').map(t => t.elements?.map(e => e.text || '').join('') || '').join('');
async function inspect(name, data, marker, line) {
  const buffer = data instanceof Blob ? Buffer.from(await data.arrayBuffer()) : data;
  await fs.writeFile(`${outputDir}/${name}.docx`, buffer);
  const zip = await JSZip.loadAsync(buffer);
  const xml = xml2js(await zip.file('word/document.xml').async('string'));
  const sects = all(xml, 'w:sectPr');
  assert(sects.length, `${name}: section properties`);
  for (const sect of sects) {
    assert.deepEqual(all(sect, 'w:pgSz')[0].attributes, { 'w:w': '11906', 'w:h': '16838', 'w:orient': 'portrait' }, `${name}: A4`);
    const attrs = all(sect, 'w:pgMar')[0].attributes;
    for (const [key, val] of Object.entries({ top: 2268, left: 2268, right: 1701, bottom: 1701, header: 1134, footer: 1134 })) assert.equal(attrs[`w:${key}`], String(val), `${name}: ${key}`);
  }
  if (marker) {
    const p = all(xml, 'w:p').find(p => plainText(p) === marker);
    assert(p, `${name}: body paragraph found`);
    assert.equal(all(p, 'w:spacing')[0]?.attributes['w:line'], String(line), `${name}: body spacing`);
    assert.equal(all(p, 'w:spacing')[0]?.attributes['w:after'], '0', `${name}: body after=0`);
    assert.equal(all(p, 'w:ind')[0]?.attributes['w:firstLine'], '850', `${name}: indent 1.5 cm`);
  }
  const styles = await zip.file('word/styles.xml').async('string');
  assert(styles.includes('Times New Roman'), `${name}: default font`);
  console.log(`PASS ${name}: A4, margins 4/4/3/3 cm, header/footer 2 cm${marker ? ', body spacing and indent' : ''}`);
  return { xml, zip };
}

const marker = 'Penelitian ini membahas kualitas pelayanan. Analisis menggunakan data yang tersedia.';
const report = { title: 'Pengaruh Kualitas Pelayanan', course: 'Manajemen', outputType: 'Proposal Skripsi', executiveSummary: marker,
  studentMeta: { name: 'Mahasiswa Uji', nim: '2026000001', program: 'Manajemen', year: '2026' },
  sections: [{ title: 'BAB I PENDAHULUAN', body: '' }, { title: '1.1 Latar Belakang Penelitian', body: marker }, { title: 'BAB II TINJAUAN PUSTAKA', body: '' }, { title: '2.1 Landasan Teori', body: marker }],
  references: ['Zeta. (2020). Buku Z. Bandung: Penerbit.', 'Alpha. (2021). Buku A. Jakarta: Penerbit.'], appendices: [], rubricChecks: [], generatedWith: { model: 'fixture', fallback: true } };
for (const profile of ['proposal-skripsi', 'skripsi', 'makalah']) {
  const result = await inspect(`assignment-${profile}`, await exportAssignmentDocx({ ...report, writingProfile: profile }), marker, profile === 'makalah' ? 360 : 480);
  assert.equal(all(result.xml, 'w:sectPr').length, 5);
  const numbering = all(result.xml, 'w:pgNumType').map(n => n.attributes);
  assert(numbering.some(n => n['w:fmt'] === 'lowerRoman' && n['w:start'] === '1'));
  assert.equal(numbering.filter(n => n['w:fmt'] === 'decimal' && n['w:start'] === '1').length, 1, 'Only the first chapter restarts');
  const refs = all(result.xml, 'w:p').filter(p => /^(Alpha|Zeta)\./.test(plainText(p)));
  assert(plainText(refs[0]).startsWith('Alpha'));
  for (const p of refs) { assert.equal(all(p, 'w:spacing')[0].attributes['w:line'], '240'); assert.equal(all(p, 'w:ind')[0].attributes['w:hanging'], '850'); }
  const headings = all(result.xml, 'w:p').filter(p => plainText(p).startsWith('BAB'));
  assert(headings.every(p => all(p, 'w:sz')[0]?.attributes['w:val'] === '24'));
}
const thesis = { x1: 'Kualitas Pelayanan', x2: 'Harga', y: 'Kepuasan Pelanggan', objek: 'Usaha Uji' };
await inspect('bab1', await generateBab1Docx({ ...defaultBab1State, namaObjek: 'Usaha Uji', lokasi: 'Cirebon', fenomena: marker, salesData: [{tahun: '2026', target: '100', realisasi: '80'}], consumerData: [], competitors: [] }, thesis));
const proposalBab1 = await inspect('bab1-sempro', await generateBab1Docx({ ...defaultBab1State, documentType: 'proposal-skripsi', namaObjek: 'Usaha Uji', fenomena: marker }, thesis));
assert(plainText(proposalBab1.xml).includes('1.5 Sistematika Penulisan'));
assert.equal(all(proposalBab1.xml, 'w:sectPr').length, 2, 'BAB I plus bibliography section');
assert.equal(getCitationFor('media sosial').citation, 'Tuten & Solomon (2018)');
assert.equal(getCitationFor('kompetensi pegawai').citation, '', 'Do not assign an unrelated marketing citation');
assert(getBab1References(['media sosial']).every(entry => entry.includes('Los Angeles: SAGE')));
await inspect('bab4', await generateBab4Docx(`# BAB IV HASIL PENELITIAN DAN PEMBAHASAN\n${marker}`, REFERENCE_DB.slice(0, 2)), marker, 480);
const regressionFixture = { coefficients: { intercept: 1, X1: 0.2, X2: 0.3 }, tValues: { intercept: 1, X1: 2, X2: 3 }, pValues: { intercept: 0.1, X1: 0.02, X2: 0.01 }, r: 0.7, rSquare: 0.49, adjustedRSquare: 0.45, fValue: 4, fSig: 0.01, n: 30, variables: ['X1', 'X2'], variableNames: ['Kualitas Pelayanan', 'Harga'] };
const bab4 = generateBab4Enhanced({ validityResults: [], reliabilityResults: [], regressionResult: regressionFixture, multicollinearityResults: [], normalityResult: { meanResidual: 0, stdResidual: 1, n: 30, interpretation: 'Hasil pengujian' }, heteroskedasticityResults: [], yVariable: { name: 'Kepuasan Pelanggan', key: 'Y', items: ['Y.1'] } });
assert(bab4.text.includes('## 4.2 Hasil Penelitian'));
assert(bab4.text.includes('### 4.2.9 Koefisien Determinasi'));
const numberedBab4 = await inspect('bab4-official-numbering', await generateBab4Docx(bab4.text, bab4.refsUsed));
assert(plainText(numberedBab4.xml).includes('4.2.9 Koefisien Determinasi'));
assert(!plainText(numberedBab4.xml).includes('###'));
assert.equal(buildSalesTable([{ tahun: '2026', target: '100', realisasi: '80' }], 'Uji', 'tidak_tersedia').rows.length, 0);
const demo = [{ kategori: 'Kategori Uji', frekuensi: 2, persentase: '100%' }];
const karakter = await inspect('karakteristik', await generateKarakteristikDocx({ jenisKelamin: demo, usia: [], pendidikan: [], pekerjaan: [] }, { totalResponden: 2, totalItems: 3, totalVariables: 3, completeResponden: 2, completenessPercent: 100, issues: [], cleanRowIndices: [0, 1] }));
assert(plainText(karakter.xml).includes('Tabel 4.1'));
await inspect('operasional', await generateOperasionalDocx(thesis));
const q = getQuestionnaire(thesis.x1);
assert(q, 'Questionnaire fixture must exist');
await inspect('kuesioner', await generateDocx({ judul: report.title, ...thesis, x1Data: q, x2Data: q, yData: q }));
await inspect('kelayakan', await generateInsightDocx({ ringkasan: marker, yangBaik: ['Kelengkapan data'], yangPerluDiperhatikan: [], kemungkinanPenyebab: [], saranPerbaikan: [], kesimpulanAkhir: marker }, 80, 'baik'), marker, 480);
const input = { judul: 'Makalah Uji', namaKampus: 'Universitas Pamulang', fakultas: 'FEB', programStudi: 'Manajemen', mataKuliah: 'Manajemen', namaDosen: 'Dosen Uji', namaMahasiswa: 'Mahasiswa Uji', nim: '2026000001', kelas: 'A', tema: 'Kualitas Pelayanan', jumlahBab: 3, targetHalaman: 10, pedoman: '', mode: 'fast' };
await inspect('makalah-engine', await exportMakalahEngineDocx({ input, kataPengantar: marker, chapters: [{ number: 'BAB I', title: 'PENDAHULUAN', subsections: [{ id: '1.1', title: 'Latar Belakang', content: marker }] }], daftarPustaka: report.references, lampiran: [], daftarIsi: '', outline: {}, review: {}, generatedWith: report.generatedWith }), marker, 360);
const legacy = await inspect('makalah', await exportMakalahDocx({ ...defaultMakalahState, judul: 'Makalah Uji', universitas: 'Universitas Pamulang', fakultas: 'Fakultas Ekonomi dan Bisnis', programStudi: 'Manajemen', kota: 'Tangerang Selatan', anggota: [{ nama: 'Mahasiswa Uji', nim: '2026000001' }] }, { kataPengantar: marker, bab1: `1.1 Latar Belakang\n${marker}`, bab2Sections: [{ number: '2.1', title: 'Pembahasan', text: marker, tableData: { caption: 'Tabel 2.1 Data Uji', headers: ['Nama', 'Jumlah'], rows: [[{ value: 'Uji' }, { value: '10' }]], source: 'Data Uji' } }], bab3: `3.1 Kesimpulan\n${marker}`, daftarPustaka: report.references.join('\n\n') }), marker, 360);
assert.equal(all(legacy.xml, 'w:tbl').length, 1, 'Generated data table is included');
assert(all(legacy.xml, 'w:tblHeader').length === 1, 'Only table header repeats');
assert.equal(inferFebProfile('Proposal Mini Project'), 'makalah');
assert.equal(inferFebProfile('Proposal Skripsi'), 'proposal-skripsi');
assert(referenceAgeWarnings(['Penulis. (2008). Buku.'], 2026).length === 1);
assert(!febThesisOutline('skripsi').includes('1.5 Sistematika Penulisan'));
assert(febThesisOutline('proposal-skripsi').includes('1.5 Sistematika Penulisan'));
const ref = { id: 'test', author: 'Penulis, A.', year: 2016, title: 'Buku', type: 'book', publisher: 'Penerbit', city: 'Bandung', discipline: ['manajemen'], keywords: ['test'], verified: true };
assert.equal(validateReference(ref, 2026).status, 'verified');
assert.equal(validateReference({ ...ref, year: 1943, isClassic: true }, 2026).status, 'too_old');
assert.equal(validateReference({ ...ref, city: undefined }, 2026).status, 'needs_verification');
assert(formatAPA(ref).includes('Bandung: Penerbit'));
const proposalInput = normalizeInput({ ...input, judul: 'Proposal Skripsi Uji', tema: 'Penelitian kuantitatif' });
assert.equal(proposalInput.jumlahBab, 3);
const proposalOutline = await generateOutline(proposalInput);
assert.equal(proposalOutline.data.chapters.length, 3);
assert.equal(proposalOutline.data.chapters[0].subsections[4].title, 'Sistematika Penulisan');
const thesisOutline = await generateOutline(normalizeInput({ ...input, judul: 'Skripsi Uji', tema: 'Penelitian kualitatif' }));
assert.equal(thesisOutline.data.chapters.length, 5);
assert.equal(thesisOutline.data.chapters[2].subsections.at(-1).title, 'Pemeriksaan Keabsahan Data');
console.log('PASS reference age/metadata, official thesis/proposal structures, automatic profiles, numbering continuity, bibliography sorting, tables');
