import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import JSZip from 'jszip';
import { xml2js } from 'xml-js';
import { defaultBab1State } from '../lib/thesis/bab1Store.ts';
import { emptyProposal, starterSections } from '../lib/thesis/proposal.ts';
import { contextualDraft } from '../lib/thesis/proposalGeneration.ts';
import { completeGyfinDraft, gyfinOperations, isGyfinResearch } from '../lib/thesis/gyfinCompletion.ts';
import { exportProposalDocx } from '../lib/thesis/proposalDocx.ts';

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
for (const table of all(xml, 'w:tbl')) {
  assert(all(table, 'w:tr')[0] && all(all(table, 'w:tr')[0], 'w:tblHeader').length);
  for (const size of all(table, 'w:sz')) assert.equal(size.attributes['w:val'], '24', 'All manuscript tables use TNR 12');
}
await fs.mkdir('/tmp/gyfin-revision-evidence', { recursive: true });
await fs.writeFile('/tmp/gyfin-revision-evidence/Revisi-BAB-II-III-GYFIN-SOCK.docx', bytes);
await fs.writeFile('/tmp/gyfin-revision-evidence/proposal.json', JSON.stringify(result.proposal, null, 2));
console.log('PASS sourced GYFIN completion, old drafts, manual facts/dimensions preserved, no invented samples/dates, idempotence, 30-item mapping, two-chapter DOCX and TNR12 tables');
