import { AlignmentType, HeadingLevel, ImageRun, Packer, Paragraph, Table, Tab, TabStopType, TextRun } from 'docx';
import { academicRuns, createFebDocument, FEB_INDENT, febSection } from '@/lib/docx/feb2021';
import { buildBab1Content } from './bab1DocxExport';
import type { Bab1State } from './bab1Store';
import type { ThesisState } from './store';
import { PROPOSAL_DIAGRAM_PNG } from './proposalDiagram';
import { emptyProposal, PROPOSAL_SECTIONS, starterSections, type ProposalState } from './proposal';
import { ProposalContents } from './proposalContents';
import { studyReferences } from './priorStudies';
import { manuscriptTable, uniqueReferences } from './manuscriptLayout';

export type ProposalExport = 'bab1' | 'bab2' | 'bab3' | 'bab2-bab3' | 'combined';
const chapterTitle = (text: string) => new Paragraph({ children: [new TextRun({ text, bold: true, font: 'Times New Roman', size: 24 })], alignment: AlignmentType.CENTER, spacing: { before: 0, after: 0, line: 480 }, keepNext: true });
const heading = (text: string, third = false) => new Paragraph({ heading: third ? HeadingLevel.HEADING_3 : HeadingLevel.HEADING_2, children: [new TextRun({ text, bold: true, font: 'Times New Roman', size: 24 })], spacing: { before: 0, after: 0, line: 480 }, keepNext: true });
const body = (text: string) => new Paragraph({ children: academicRuns(text), alignment: AlignmentType.JUSTIFIED, spacing: { before: 0, after: 0, line: 480 }, indent: { firstLine: FEB_INDENT }, keepLines: true, widowControl: true });
const textParagraphs = (text: string, contents?: ProposalContents) => text.split(/\n+/).map(t => t.trim()).filter(Boolean).map(t => {
  if (/^\d+\.\d+\.\d+\s/.test(t)) return contents ? contents.heading(t, 3) : heading(t, true);
  const point = t.match(/^(H\d+:|\d+[.)])\s+(.+)$/);
  return point ? new Paragraph({ children: [new TextRun({ children: [point[1], new Tab()], font: 'Times New Roman', size: 24 }), ...academicRuns(point[2])], alignment: AlignmentType.JUSTIFIED, indent: { left: FEB_INDENT, hanging: FEB_INDENT }, tabStops: [{ type: TabStopType.LEFT, position: FEB_INDENT }], spacing: { before: 0, after: 0, line: 480 }, keepLines: true, widowControl: true }) : body(t);
});
const blank = () => new Paragraph({ text: '', spacing: { before: 0, after: 0, line: 480 } });
function caption(text: string) { return new Paragraph({ children: [new TextRun({ text, font: 'Times New Roman', size: 24, bold: true })], alignment: AlignmentType.CENTER, spacing: { before: 0, after: 0, line: 240 }, keepNext: true, keepLines: true }); }
function source(text: string) { return new Paragraph({ children: [new TextRun({ text, font: 'Times New Roman', size: 20 })], spacing: { before: 0, after: 0, line: 240 } }); }
/** Editorial prompts belong in the editor, never in a completed manuscript. */
export function manuscriptText(text: string): string {
  return text.replace(/\[(?:Isi|Lengkapi|Tambahkan|Konfirmasikan|Verifikasi|Halaman artikel belum diverifikasi|Tahun pada kiriman:)[^\]]*\]/gi, '').replace(/[ \t]+([.,;])/g, '$1').replace(/[ \t]{2,}/g, ' ').trim();
}
function reference(text: string) {
  const formatted = text.replace(/(?<!\*)(Principles of marketing|Principles of management|Introduction to modern statistics|An introduction to statistical learning: With applications in Python)(?!\*)/gi, '*$1*');
  return new Paragraph({ children: academicRuns(formatted), spacing: { before: 0, after: 0, line: 240 }, indent: { left: FEB_INDENT, hanging: FEB_INDENT }, keepLines: true, widowControl: true });
}
function chapterContent(chapter: 2 | 3, state: ProposalState, thesis: ThesisState, bab1: Bab1State, contents?: ProposalContents, template = false): (Paragraph | Table)[] {
  const defaults = starterSections(thesis, bab1);
  const number = chapter === 2 ? 'BAB II' : 'BAB III';
  const title = chapter === 2 ? 'TINJAUAN PUSTAKA' : 'METODE PENELITIAN';
  const children: (Paragraph | Table)[] = [contents ? contents.heading(number, 1, `${number}\t${title}`) : chapterTitle(number), chapterTitle(title)];
  const pendingSchedule = /\bTabel\s+3\.1\b|jadwal penelitian|rencana jadwal|\[Isi periode dan jadwal/i.test(state.sections.location);
  const operationNumber = pendingSchedule ? '3.2' : '3.1';
  const printable = (text: string) => template ? text : manuscriptText(text);
  const frameworkDescription = `Keterangan: X1 = ${thesis.x1 || '[Variabel X1]'}; X2 = ${thesis.x2 || '[Variabel X2]'}; Y = ${thesis.y || '[Variabel Y]'}. H1 dan H2 menunjukkan pengaruh parsial, sedangkan H3 menunjukkan pengaruh simultan yang akan diuji.`;
  for (const s of PROPOSAL_SECTIONS.filter(s => s.chapter === chapter)) {
    let sectionText = state.sections[s.id].trim() || defaults[s.id];
    if (s.id === 'operations') sectionText = sectionText.replace(/\bTabel\s+3\.\d+\b/g, `Tabel ${operationNumber}`);
    // Older generated drafts already contain the caption we add after the image.
    if (s.id === 'framework') sectionText = sectionText.replace(frameworkDescription, '').trim();
    children.push(contents ? contents.heading(s.title, 2) : heading(s.title), ...textParagraphs(printable(sectionText), contents));
    if (s.id === 'studies') {
      const rows = state.studies.filter(r => Object.values(r).some(v => v?.trim())).map((r,i) => [String(i + 1), `${printable(r.author.trim()) || (template ? '[Peneliti dan tahun]' : '—')}\n${r.title.trim() || (template ? '[Judul penelitian]' : '—')}`, printable(r.journal?.trim() || '') || (template ? '[Lengkapi identitas jurnal]' : '—'), [printable(r.result.trim()) || (template ? '[Lengkapi hasil penelitian]' : '—'), r.method.trim() ? `Metode: ${printable(r.method.trim())}` : ''].filter(Boolean).join('\n')]);
      children.push(caption('Tabel 2.1 Penelitian Terdahulu'), manuscriptTable(['No', 'Nama dan Judul Penelitian', 'Nama Jurnal', 'Hasil Penelitian'], rows.length ? rows : [['1', template ? '[Peneliti, tahun dan judul]' : '—', template ? '[Nama jurnal, volume dan nomor]' : '—', template ? '[Temuan asli dan metode]' : '—']], [430, 2590, 2000, 2917], 20, [0]));
      children.push(source('Sumber: Referensi penelitian terdahulu yang dicantumkan pada tabel.'));
      for (const row of state.studies.filter(r => r.comparison.trim())) children.push(body(`${printable(row.author)}: ${printable(row.comparison)}`));
    }
    if (s.id === 'framework') {
      children.push(new Paragraph({ children: [new ImageRun({ type: 'png', data: Uint8Array.from(atob(PROPOSAL_DIAGRAM_PNG), c => c.charCodeAt(0)), transformation: { width: 500, height: 211 }, altText: { title: 'Kerangka berpikir', description: 'X1 dan X2 menuju Y secara parsial (H1, H2) dan simultan (H3).', name: 'Kerangka berpikir' } })], alignment: AlignmentType.CENTER, keepNext: true }), caption('Gambar 2.1 Kerangka Berpikir'), source('Sumber: Rancangan model penelitian.'), body(frameworkDescription));
    }
    if (s.id === 'location' && pendingSchedule) {
      children.push(caption('Tabel 3.1 Rencana Jadwal Penelitian'), manuscriptTable(['Tahap', 'Waktu Pelaksanaan'], ['Penyusunan proposal', 'Penelaahan dan uji coba instrumen', 'Pengumpulan data', 'Pengolahan dan analisis', 'Penyusunan laporan', 'Sidang'].map(stage => [stage, '']), [4700, 3237]), source('Sumber: Rencana penelitian.'));
    }
    if (s.id === 'operations') {
      const rows = state.operations.filter(r => Object.values(r).some(v => v.trim())).map(r => [r.variable, r.definition, r.indicators, r.scale, r.source].map(v => printable(v.trim()) || (template ? '[Lengkapi]' : '—')));
      children.push(caption(`Tabel ${operationNumber} Operasional Variabel Penelitian`), manuscriptTable(['Variabel', 'Definisi Operasional', 'Indikator', 'Skala', 'Sumber'], rows.length ? rows : [thesis.x1 || '[X1]', thesis.x2 || '[X2]', thesis.y || '[Y]'].map(v => [v, '[Definisi]', '[Indikator]', '[Skala]', '[Penulis, tahun]']), [1050, 2150, 2087, 950, 1700], 20));
      children.push(source('Sumber: Rujukan teori yang dicantumkan pada tabel.'));
    }
    children.push(blank());
  }
  return children;
}
function templateBab1(contents?: ProposalContents): Paragraph[] {
  const sections = ['1.1 Latar Belakang Penelitian', '1.2 Rumusan Masalah', '1.3 Tujuan Penelitian', '1.4 Manfaat Penelitian', '1.5 Sistematika Penulisan'];
  return [contents ? contents.heading('BAB I', 1, 'BAB I\tPENDAHULUAN', '1') : chapterTitle('BAB I'), chapterTitle('PENDAHULUAN'), ...sections.flatMap(s => [contents ? contents.heading(s, 2) : heading(s), body(`[Isi ${s.replace(/^\d\.\d /, '')} sesuai penelitian Anda.]`), blank()])];
}
/** Each chapter is a distinct Word section; only BAB I resets Arabic numbering. */
export async function exportProposalDocx(state: ProposalState, thesis: ThesisState, bab1: Bab1State, target: ProposalExport, template = false): Promise<Blob> {
  if (template) { state = emptyProposal(); thesis = { x1: '', x2: '', y: '', objek: '' }; bab1 = { ...bab1, namaObjek: '', lokasi: '' }; }
  const contents = target === 'combined' ? new ProposalContents() : undefined;
  const contentsTitle = contents?.heading('DAFTAR ISI', 1, 'DAFTAR ISI', 'i');
  const first = template ? { children: templateBab1(contents), references: [] as string[] } : buildBab1Content({ ...bab1, documentType: 'proposal-skripsi', namaObjek: bab1.namaObjek || thesis.objek }, thesis, contents);
  const sections = [];
  if (target === 'bab1' || target === 'combined') sections.push(febSection(first.children, 'chapter', 1));
  if (target === 'bab2' || target === 'bab2-bab3' || target === 'combined') sections.push(febSection(chapterContent(2, state, thesis, bab1, contents, template), 'chapter', target === 'combined' ? undefined : 1));
  if (target === 'bab3' || target === 'bab2-bab3' || target === 'combined') sections.push(febSection(chapterContent(3, state, thesis, bab1, contents, template), 'chapter', target === 'combined' || target === 'bab2-bab3' ? undefined : 1));
  const references = uniqueReferences([...(target === 'bab1' || target === 'combined' ? first.references : []), ...state.references.split(/\n+/).map(s => s.trim()).filter(Boolean), ...(target === 'bab2' || target === 'bab2-bab3' || target === 'combined' ? studyReferences(state.studies) : [])]);
  sections.push(febSection([contents ? contents.heading('DAFTAR PUSTAKA', 1) : chapterTitle('DAFTAR PUSTAKA'), ...(references.length ? references.map(r => reference(template ? r : manuscriptText(r))) : [reference('[Tuliskan daftar pustaka dari semua sumber yang disitasi; urutkan menurut abjad.]')])], 'back'));
  if (contents && contentsTitle) sections.unshift(febSection(contents.table(contentsTitle), 'front', 1));
  return Packer.toBlob(createFebDocument({ sections, ...(contents ? { styles: { paragraphStyles: contents.styles() } } : {}) }, 'proposal-skripsi'));
}
