import type { ThesisState } from './store';
import type { Bab1State } from './bab1Store';

export const PROPOSAL_SECTIONS = [
  { id: 'theory', chapter: 2, title: '2.1 Landasan Teori', hint: 'Uraikan teori utama, definisi, dimensi, dan indikator setiap variabel. Cantumkan sitasi dari sumber yang benar-benar dibaca.' },
  { id: 'studies', chapter: 2, title: '2.2 Penelitian Terdahulu', hint: 'Jelaskan persamaan, perbedaan, dan celah penelitian berdasarkan jurnal yang diverifikasi. Isi tabel penelitian di bawah.' },
  { id: 'framework', chapter: 2, title: '2.3 Kerangka Berpikir', hint: 'Jelaskan hubungan X1 dan X2 dengan Y berdasarkan teori dan penelitian terdahulu. Diagram dapat dibuat di menu Kerangka Berpikir.' },
  { id: 'hypotheses', chapter: 2, title: '2.4 Pengembangan Hipotesis', hint: 'Uraikan dasar setiap hipotesis, lalu tuliskan H1, H2, dan H3. Hipotesis merupakan dugaan yang akan diuji.' },
  { id: 'method', chapter: 3, title: '3.1 Jenis Penelitian', hint: 'Jelaskan pendekatan, jenis penelitian, dan alasan pemilihannya.' },
  { id: 'location', chapter: 3, title: '3.2 Tempat dan Waktu Penelitian', hint: 'Tuliskan alamat objek, periode penelitian, serta jadwal penelitian yang sebenarnya.' },
  { id: 'operations', chapter: 3, title: '3.3 Operasional Variabel Penelitian', hint: 'Jelaskan definisi operasional, indikator, dan skala ukur. Lengkapi tabel berdasarkan rujukan teori dan instrumen Anda.' },
  { id: 'sample', chapter: 3, title: '3.4 Populasi dan Sampel', hint: 'Isi unit populasi, jumlah/periode, kriteria, teknik sampling, serta dasar perhitungan jumlah sampel. Jangan menggunakan angka contoh sebagai data penelitian.' },
  { id: 'collection', chapter: 3, title: '3.5 Teknik Pengumpulan Data', hint: 'Jelaskan sumber data, instrumen, distribusi kuesioner, dan prosedur pengumpulan data yang direncanakan.' },
  { id: 'analysis', chapter: 3, title: '3.6 Teknik Analisis Data', hint: 'Jelaskan analisis deskriptif, uji instrumen, asumsi, regresi, dan pengujian hipotesis yang sesuai desain penelitian. Sertakan kriteria keputusan dan rujukannya.' },
] as const;
export type SectionId = typeof PROPOSAL_SECTIONS[number]['id'];
export type Study = { author: string; title: string; method: string; result: string; comparison: string; journal?: string; reference?: string };
export type Operation = { variable: string; definition: string; indicators: string; scale: string; source: string };
export type ProposalState = {
  sections: Record<SectionId, string>;
  studies: Study[];
  operations: Operation[];
  references: string;
};
export const emptyStudy = (): Study => ({ author: '', title: '', method: '', result: '', comparison: '', journal: '', reference: '' });
export const emptyOperation = (): Operation => ({ variable: '', definition: '', indicators: '', scale: '', source: '' });
export function emptyProposal(): ProposalState {
  return { sections: Object.fromEntries(PROPOSAL_SECTIONS.map(s => [s.id, ''])) as Record<SectionId, string>, studies: [emptyStudy()], operations: [emptyOperation()], references: '' };
}
const STORAGE_KEY = 'smartcampus_proposal_feb2021_v1';
export function loadProposal(): ProposalState {
  const blank = emptyProposal();
  if (typeof window === 'undefined') return blank;
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    for (const s of PROPOSAL_SECTIONS) if (typeof raw.sections?.[s.id] === 'string') blank.sections[s.id] = raw.sections[s.id];
    for (const key of ['studies', 'operations'] as const) {
      const schema = key === 'studies' ? emptyStudy() : emptyOperation();
      if (Array.isArray(raw[key]) && raw[key].length) {
        const rows = raw[key].filter((r: unknown): r is Record<string, unknown> => r !== null && typeof r === 'object').map((r: Record<string, unknown>) => Object.fromEntries(Object.keys(schema).map(k => [k, typeof r[k] === 'string' ? r[k] : ''])));
        if (rows.length) Object.assign(blank, { [key]: rows });
      }
    }
    if (typeof raw.references === 'string') blank.references = raw.references;
  } catch { /* Retain editable defaults if stored data is damaged. */ }
  return blank;
}
export function saveProposal(value: ProposalState): boolean {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(value)); return true; } catch { return false; }
}
/** Editable starting text: unknown facts and citations remain explicit placeholders. */
export function starterSections(thesis: ThesisState, bab1: Bab1State): Record<SectionId, string> {
  const x1 = thesis.x1 || '[Variabel X1]', x2 = thesis.x2 || '[Variabel X2]', y = thesis.y || '[Variabel Y]';
  const object = bab1.namaObjek || thesis.objek || '[Nama objek penelitian]';
  return {
    theory: `2.1.1 ${x1}\n[Uraikan definisi, dimensi, dan indikator ${x1} beserta sitasi yang diverifikasi.]\n\n2.1.2 ${x2}\n[Uraikan definisi, dimensi, dan indikator ${x2} beserta sitasi yang diverifikasi.]\n\n2.1.3 ${y}\n[Uraikan definisi, dimensi, dan indikator ${y} beserta sitasi yang diverifikasi.]`,
    studies: '[Jelaskan hasil penelitian terdahulu, persamaan dan perbedaannya, serta celah penelitian berdasarkan sumber pada tabel. Cantumkan sitasi.]',
    framework: `Penelitian ini akan menguji hubungan ${x1} (X1) dan ${x2} (X2) dengan ${y} (Y) pada ${object}, baik secara parsial maupun simultan.\n\n[Tambahkan argumentasi teoritis dan temuan penelitian terdahulu yang mendasari setiap hubungan.]`,
    hypotheses: `[Uraikan dasar teori dan penelitian terdahulu untuk setiap hipotesis berikut.]\n\nH1: Diduga ${x1} berpengaruh terhadap ${y} pada ${object}.\n\nH2: Diduga ${x2} berpengaruh terhadap ${y} pada ${object}.\n\nH3: Diduga ${x1} dan ${x2} secara simultan berpengaruh terhadap ${y} pada ${object}.`,
    method: `Penelitian ini direncanakan menggunakan pendekatan kuantitatif untuk menguji pengaruh ${x1} dan ${x2} terhadap ${y} pada ${object}.\n\n[Jelaskan jenis penelitian, alasan pemilihan desain, dan rujukan metodologinya.]`,
    location: `Penelitian direncanakan pada ${object}${bab1.lokasi ? ` di ${bab1.lokasi}` : ''}.\n\n[Isi alamat lengkap, periode pelaksanaan, dan jadwal penelitian yang sebenarnya.]`,
    operations: `Variabel penelitian terdiri atas ${x1} (X1) dan ${x2} (X2) sebagai variabel bebas serta ${y} (Y) sebagai variabel terikat.\n\n[Jelaskan definisi operasional, indikator, dan skala berdasarkan sumber teori pada tabel.]`,
    sample: '[Jelaskan populasi dan unit analisis, periode dan jumlah populasi bila diketahui, kriteria responden, teknik pengambilan sampel, serta dasar penentuan jumlah sampel beserta sitasinya.]',
    collection: '[Jelaskan sumber data primer dan sekunder, instrumen yang digunakan, cara penyebaran kuesioner, pilihan jawaban, serta prosedur pengumpulan data yang akan dilakukan.]',
    analysis: `[Jelaskan teknik analisis deskriptif, pengujian validitas dan reliabilitas instrumen, asumsi regresi, analisis regresi berganda, serta uji t dan uji F yang akan digunakan. Tuliskan kriteria keputusan dan rujukan metodologinya.]\n\nModel yang direncanakan: Y = a + b1X1 + b2X2 + e. Dalam model tersebut, Y adalah ${y}, X1 adalah ${x1}, X2 adalah ${x2}, a merupakan konstanta, b1 dan b2 merupakan koefisien regresi, dan e merupakan galat.`,
  };
}
export function fillEmptySections(state: ProposalState, thesis: ThesisState, bab1: Bab1State): ProposalState {
  const starter = starterSections(thesis, bab1);
  return { ...state, sections: Object.fromEntries(PROPOSAL_SECTIONS.map(s => [s.id, state.sections[s.id].trim() ? state.sections[s.id] : starter[s.id]])) as Record<SectionId, string> };
}
