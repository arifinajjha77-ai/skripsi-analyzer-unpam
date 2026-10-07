import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import JSZip from 'jszip';
import { xml2js } from 'xml-js';
import { defaultBab1State } from '../lib/thesis/bab1Store.ts';
import { emptyProposal, starterSections } from '../lib/thesis/proposal.ts';
import { contextualDraft } from '../lib/thesis/proposalGeneration.ts';
import { completeGyfinDraft, gyfinOperations, isGyfinResearch } from '../lib/thesis/gyfinCompletion.ts';
import { exportProposalDocx, manuscriptText } from '../lib/thesis/proposalDocx.ts';

const input = {
  thesis: { x1: 'Harga', x2: 'Promosi', y: 'Keputusan Pembelian', objek: 'GYFIN SOCK' },
  bab1: { ...defaultBab1State, namaObjek: 'GYFIN SOCK', jenisUsaha: 'toko e-commerce', lokasi: 'Depok' },
  proposal: emptyProposal(), scope: 'all', mode: 'generate',
};
const result = completeGyfinDraft(input);
assert.equal(result.completed.length, 10);
assert.equal(result.proposal.operations.length, 3);
assert.deepEqual(result.proposal.operations, gyfinOperations);
assert.equal(result.proposal.studies.length, 10);
assert(result.proposal.sections.theory.includes('adaptasi instrumen'));
assert(!result.proposal.sections.theory.includes('[Lengkapi sitasi definisi'));
assert(result.proposal.sections.analysis.includes('β1 = β2 = 0'));
assert(result.proposal.sections.analysis.includes('tidak berarti setiap prediktor signifikan'));
assert(result.proposal.sections.sample.includes('[Isi teknik sampling'));
assert(result.proposal.sections.location.includes('di Depok'));
assert(!result.proposal.sections.sample.includes('Sampel berjumlah 60'));
assert(result.proposal.references.includes('James'));
const old = { ...input, proposal: { ...emptyProposal(), sections: contextualDraft(input) } };
assert.equal(completeGyfinDraft(old).completed.length, 10, 'An exact old generated draft can be filled');
assert.equal(completeGyfinDraft({ ...input, proposal: { ...emptyProposal(), sections: starterSections(input.thesis, input.bab1) } }).completed.length, 10);
const sample = 'Populasi 500 konsumen dan sampel 92 responden dengan purposive sampling. [Isi rujukan.]';
const location = 'Penelitian di Depok pada Oktober 2026. [Isi alamat rinci.]';
const custom = completeGyfinDraft({ ...old, proposal: { ...old.proposal, sections: { ...old.proposal.sections, sample, location } } });
assert.equal(custom.proposal.sections.sample, sample);
assert.equal(custom.proposal.sections.location, location);
assert(!custom.completed.includes('sample'));
const manualOperation = { variable: 'Harga', definition: 'Definisi peneliti', indicators: 'Indikator lain', scale: 'Ordinal', source: 'Sumber asli' };
const manual = completeGyfinDraft({ ...input, proposal: { ...emptyProposal(), operations: [manualOperation] } });
assert.deepEqual(manual.proposal.operations, [manualOperation]);
assert.equal(manual.proposal.sections.theory, '', 'Do not overwrite theory with contradictory questionnaire dimensions');
const again = completeGyfinDraft({ ...input, proposal: result.proposal });
assert.equal(again.completed.length, 0);
assert.deepEqual(again.proposal, result.proposal, 'Completion is idempotent and preserves the revised draft');
assert(!isGyfinResearch({ ...input, thesis: { ...input.thesis, x2: 'Kualitas Pelayanan' } }));
assert.throws(() => completeGyfinDraft({ ...input, bab1: { ...input.bab1, namaObjek: 'Objek lain' } }));

const all = (node, name) => [...(node.name === name ? [node] : []), ...(node.elements || []).flatMap(c => all(c, name))];
const textOf = node => all(node, 'w:t').map(t => (t.elements || []).map(e => e.text || '').join('')).join('');
const blob = await exportProposalDocx(result.proposal, input.thesis, input.bab1, 'bab2-bab3');
const bytes = Buffer.from(await blob.arrayBuffer());
const zip = await JSZip.loadAsync(bytes);
const xml = xml2js(await zip.file('word/document.xml').async('string'));
const text = textOf(xml);
assert(text.includes('BAB II') && text.includes('BAB III'));
assert(!text.includes('BAB I\nPENDAHULUAN'));
assert(text.includes('Tabel 3.1 Rencana Jadwal Penelitian'));
assert(text.includes('Tabel 3.2 Operasional Variabel Penelitian'));
assert(text.includes('X2.8–X2.10'));
assert.equal(all(xml, 'w:sectPr').length, 3);
assert.equal(all(xml, 'w:pgNumType').filter(n => n.attributes['w:start'] === '1').length, 1);
assert(!text.includes('[Isi tanggal/bulan sebenarnya]'));
assert(!text.includes('[Isi teknik sampling'));
assert(!text.includes('[Lengkapi metode'));
assert(result.proposal.sections.sample.includes('[Isi teknik sampling'), 'Export must not modify editable draft instructions');
const tables = all(xml, 'w:tbl');
const studiesTable = tables.find(t => textOf(t).includes('Nama dan Judul Penelitian'));
const studyRows = all(studiesTable, 'w:tr');
assert.equal(all(studyRows[0], 'w:tc').length, 4);
assert.equal(textOf(all(studyRows[0], 'w:tc')[3]), 'Hasil Penelitian');
assert(textOf(all(studyRows[1], 'w:tc')[3]).includes(result.proposal.studies[0].result));
assert(textOf(all(studyRows[1], 'w:tc')[3]).includes(`Metode: ${result.proposal.studies[0].method}`), 'Method is retained in the wider results cell');
const schedule = tables.find(t => textOf(t).startsWith('TahapWaktu Pelaksanaan'));
for (const row of all(schedule, 'w:tr').slice(1)) assert.equal(textOf(all(row, 'w:tc')[1]), '', 'Unknown dates remain blank');
assert.equal(manuscriptText('Penelitian di Depok pada Oktober 2026. [Isi alamat rinci.]'), 'Penelitian di Depok pada Oktober 2026.');
assert.equal(manuscriptText('Harga [X1] dan sumber [catatan responden].'), 'Harga [X1] dan sumber [catatan responden].');
const templateZip = await JSZip.loadAsync(await (await exportProposalDocx(result.proposal, input.thesis, input.bab1, 'bab3', true)).arrayBuffer());
assert(textOf(xml2js(await templateZip.file('word/document.xml').async('string'))).includes('[Isi'), 'Blank templates retain their fill-in prompts');
for (const table of all(xml, 'w:tbl')) {
  assert(all(table, 'w:tr')[0] && all(all(table, 'w:tr')[0], 'w:tblHeader').length);
  for (const size of all(table, 'w:sz')) assert(['20', '24'].includes(size.attributes['w:val']), 'Tables use TNR 10–12 within the FEB guide');
  for (const row of all(table, 'w:tr')) assert(all(row, 'w:cantSplit').length, 'Records remain together across pages');
}
// A saved manuscript may have removed its editorial prompt while still citing the schedule.
const edited = { ...result.proposal, sections: { ...result.proposal.sections, location: 'Tahap penelitian disajikan pada Tabel 3.1. Waktu pelaksanaan belum ditetapkan.', operations: 'Indikator dirangkum pada Tabel 3.2.' } };
const editedZip = await JSZip.loadAsync(await (await exportProposalDocx(edited, input.thesis, input.bab1, 'bab3')).arrayBuffer());
const editedXml = xml2js(await editedZip.file('word/document.xml').async('string'));
assert(textOf(editedXml).includes('Tabel 3.1 Rencana Jadwal Penelitian'));
assert(textOf(editedXml).includes('Tabel 3.2 Operasional Variabel Penelitian'));
const legacyFramework = { ...result.proposal, sections: { ...result.proposal.sections, framework: `${result.proposal.sections.framework}\n\nKeterangan: X1 = Harga; X2 = Promosi; Y = Keputusan Pembelian. H1 dan H2 menunjukkan pengaruh parsial, sedangkan H3 menunjukkan pengaruh simultan yang akan diuji.` } };
const frameworkZip = await JSZip.loadAsync(await (await exportProposalDocx(legacyFramework, input.thesis, input.bab1, 'bab2')).arrayBuffer());
assert.equal(textOf(xml2js(await frameworkZip.file('word/document.xml').async('string'))).split('Keterangan: X1 = Harga').length - 1, 1, 'A legacy generated caption is exported once');
const { uniqueReferences } = await import('../lib/thesis/manuscriptLayout.ts');
assert.deepEqual(uniqueReferences(['Penulis. (2024). Studi. Jurnal, 1(1), 1–5.', 'Penulis. (2024). Studi. Jurnal, 1(1), 1–5. https://doi.org/10.1234/studi']), ['Penulis. (2024). Studi. Jurnal, 1(1), 1–5. https://doi.org/10.1234/studi']);
await fs.mkdir('/tmp/gyfin-revision-evidence', { recursive: true });
await fs.writeFile('/tmp/gyfin-revision-evidence/Revisi-BAB-II-III-GYFIN-SOCK.docx', bytes);
await fs.writeFile('/tmp/gyfin-revision-evidence/proposal.json', JSON.stringify(result.proposal, null, 2));
console.log('PASS GYFIN completion, preserved facts, four-column studies, intact table rows, consistent schedule numbering after edits, unique references, blank unknown dates, templates, 30-item mapping');
