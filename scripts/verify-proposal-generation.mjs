import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import JSZip from 'jszip';
import { xml2js } from 'xml-js';
import { defaultBab1State } from '../lib/thesis/bab1Store.ts';
import { emptyProposal, starterSections } from '../lib/thesis/proposal.ts';
import { contextualDraft, generationInputSchema, generationTargets, localGeneration, generationPrompt, polishProse, researchTitle, validateGeneratedSections } from '../lib/thesis/proposalGeneration.ts';
import { exportProposalDocx } from '../lib/thesis/proposalDocx.ts';
import { POST } from '../app/api/proposal/generate/route.ts';
import { getOpenAIClient } from '../lib/ai/openai.ts';

const thesis = { x1: 'Harga', x2: 'Promosi', y: 'Keputusan Pembelian', objek: 'Objek Uji' };
const bab1 = { ...defaultBab1State, namaObjek: 'Objek Uji', lokasi: 'Lokasi Uji', fenomena: 'Harga dan promosi menjadi persoalan yang hendak ditelaah pada objek penelitian.' };
const input = { thesis, bab1, proposal: emptyProposal(), scope: 'all', mode: 'generate' };
assert(generationInputSchema.safeParse(input).success);
assert(!generationInputSchema.safeParse({ ...input, thesis: { ...thesis, x1: '' } }).success);
assert(!generationInputSchema.safeParse({ ...input, scope: 'invalid' }).success);
const result = localGeneration(input);
assert.equal(Object.keys(result.sections).length, 10);
assert(result.sections.theory.includes('Harga berkaitan dengan pengorbanan'));
assert(result.sections.theory.includes('2.1.1 Harga'));
assert(result.sections.theory.includes('2.1.2 Promosi'));
assert(result.sections.method.includes(researchTitle(thesis, bab1)));
assert(result.sections.analysis.includes('Y = a + b1X1 + b2X2 + e'));
assert(result.sections.hypotheses.includes('H3: Diduga Harga dan Promosi secara simultan'));
assert(!result.sections.sample.includes('100 responden'));
assert(!result.sections.location.includes('Januari'));
assert(!result.sections.studies.includes('berpengaruh positif dan signifikan'));
assert(result.referencesToAdd.some(r => r.includes('Kotler') && r.includes('Boston: Pearson')));
const starter = { ...input, proposal: { ...emptyProposal(), sections: starterSections(thesis, bab1) } };
assert.equal(Object.keys(localGeneration(starter).sections).length, 10, 'The previous placeholder-only button can be upgraded automatically');
const written = { ...starter.proposal, sections: { ...starter.proposal.sections, sample: 'Populasi terdiri atas 500 konsumen. Sampel berjumlah 92 responden dengan teknik purposive sampling.', theory: 'Definisi variabel sudah ditulis berdasarkan sumber yang dibaca.' }, references: 'Sumber yang sudah diisi peneliti.' };
const filled = localGeneration({ ...input, proposal: written });
assert(!('sample' in filled.sections) && !('theory' in filled.sections), 'Chapter generation preserves actual writing');
assert(!('method' in localGeneration({ ...input, scope: 'bab2' }).sections));
assert(!('theory' in localGeneration({ ...input, scope: 'bab3' }).sections));
const studyProposal = emptyProposal();
studyProposal.studies = [{ author: 'Peneliti Uji (2025)', title: 'Judul Studi Uji', method: 'survei', result: 'Tidak ditemukan pengaruh parsial dalam studi tersebut.', comparison: 'variabel yang sama dengan objek berbeda' }];
studyProposal.operations = [{ variable: 'Harga', definition: 'Penilaian kesesuaian biaya dan manfaat menurut responden.', indicators: 'Indikator A dan Indikator B', scale: 'Ordinal', source: 'Peneliti Uji (2025)' }];
const grounded = contextualDraft({ ...input, proposal: studyProposal });
assert(grounded.studies.includes('Tidak ditemukan pengaruh parsial'));
assert(grounded.operations.includes('Indikator A dan Indikator B'));
assert(grounded.theory.includes('Penilaian kesesuaian biaya dan manfaat'));
const custom = 'Dalam konteks penelitian ini, Harga tidak berpengaruh positif dan signifikan. Sampel 92 dari 500 konsumen di Objek Uji (Peneliti, 2025).\n\n[Isi waktu penelitian.]';
const editInput = { ...input, scope: 'sample', mode: 'polish', proposal: { ...emptyProposal(), sections: { ...emptyProposal().sections, sample: custom } } };
const polished = localGeneration(editInput);
assert(polished.sections.sample.startsWith('Dalam penelitian ini'));
assert(polished.sections.sample.includes('92 dari 500'));
assert(polished.sections.sample.includes('(Peneliti, 2025)'));
assert(polished.sections.sample.includes('[Isi waktu penelitian.]'));
assert.equal(polished.referencesToAdd.length, 0);
assert.equal(validateGeneratedSections({ sections: { sample: polished.sections.sample.replace('Objek Uji', 'Objek Lain') } }, editInput), null);
assert.equal(polishProse(custom), polished.sections.sample);
assert(validateGeneratedSections({ sections: { sample: polished.sections.sample } }, editInput));
assert.equal(validateGeneratedSections({ sections: { sample: polished.sections.sample.replace('92', '93') } }, editInput), null);
assert.equal(validateGeneratedSections({ sections: { sample: polished.sections.sample.replace('tidak ', '') } }, editInput), null);
assert.equal(validateGeneratedSections({ sections: { sample: polished.sections.sample.replace('[Isi waktu penelitian.]', 'Januari 2026') } }, editInput), null);
assert.equal(validateGeneratedSections({ sections: { sample: 'Populasi terdiri atas 99999999 responden menurut Peneliti Fiktif (1991).' } }, { ...input, scope: 'sample' }), null);
assert.equal(validateGeneratedSections({ sections: {} }, input), null);
assert(generationPrompt(input).includes('BAB III harus konsisten'));
assert(generationPrompt(input).includes('Jangan memberikan persentase manusia'));
assert.equal(researchTitle(thesis, { ...bab1, namaObjek: 'Objek BAB I terbaru' }).includes('Objek BAB I terbaru'), true);
assert.equal(generationTargets({ ...input, proposal: { ...emptyProposal(), sections: { ...emptyProposal().sections, ...result.sections } } }).length, 0);

// Route boundary: use offline generation for a repeatable test without a paid API call.
const previousKey = process.env.OPENAI_API_KEY;
delete process.env.OPENAI_API_KEY;
try {
  const response = await POST(new Request('http://localhost/api/proposal/generate', { method: 'POST', headers: { origin: 'http://localhost' }, body: JSON.stringify(input) }));
  assert.equal(response.status, 200);
  const actual = await response.json();
  assert.equal(actual.engine, 'contextual'); assert.equal(Object.keys(actual.sections).length, 10);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  const invalid = await POST(new Request('http://localhost/api/proposal/generate', { method: 'POST', body: JSON.stringify({}) })); assert.equal(invalid.status, 400);
  const malformed = await POST(new Request('http://localhost/api/proposal/generate', { method: 'POST', body: '{broken' })); assert.equal(malformed.status, 400);
  const foreign = await POST(new Request('http://localhost/api/proposal/generate', { method: 'POST', headers: { origin: 'https://other.example' }, body: JSON.stringify(input) })); assert.equal(foreign.status, 403);
  const oversized = await POST(new Request('http://localhost/api/proposal/generate', { method: 'POST', body: 'x'.repeat(250001) })); assert.equal(oversized.status, 413);
} finally { if (previousKey !== undefined) process.env.OPENAI_API_KEY = previousKey; }
// An unchanged AI response still receives safe phrase cleanup before reaching the editor.
process.env.OPENAI_API_KEY = 'local-fixture-not-a-real-key';
const client = getOpenAIClient();
const originalCreate = client.responses.create;
try {
  client.responses.create = async () => ({ output_text: JSON.stringify({ sections: { sample: custom } }) });
  const response = await POST(new Request('http://localhost/api/proposal/generate', { method: 'POST', body: JSON.stringify(editInput) }));
  const data = await response.json();
  assert.equal(data.engine, 'ai');
  assert.equal(data.sections.sample, polishProse(custom));
  client.responses.create = async () => ({ output_text: JSON.stringify({ sections: { sample: 'Hasil survei mencatat 99999999 responden menurut Peneliti Baru (1991).' } }) });
  const rejected = await POST(new Request('http://localhost/api/proposal/generate', { method: 'POST', body: JSON.stringify({ ...input, scope: 'sample' }) }));
  const safe = await rejected.json(); assert.equal(safe.engine, 'contextual'); assert(!safe.sections.sample.includes('99999999'));
} finally { client.responses.create = originalCreate; if (previousKey !== undefined) process.env.OPENAI_API_KEY = previousKey; else delete process.env.OPENAI_API_KEY; }

// Actual Word output retains generated natural paragraphs and official chapter formatting.
const all = (node, name) => [...(node.name === name ? [node] : []), ...(node.elements || []).flatMap(c => all(c, name))];
const textOf = node => all(node, 'w:t').map(t => (t.elements || []).map(e => e.text || '').join('')).join('');
const proposal = { ...emptyProposal(), sections: { ...result.sections, method: result.sections.method + '\n\nJenis penelitian yang direncanakan bersifat explanatory.' }, references: result.referencesToAdd.join('\n') };
await fs.mkdir('/tmp/sempro-auto-evidence', { recursive: true });
for (const target of ['bab2', 'bab3', 'combined']) {
  const blob = await exportProposalDocx(proposal, thesis, bab1, target); const bytes = Buffer.from(await blob.arrayBuffer());
  await fs.writeFile(`/tmp/sempro-auto-evidence/generated-${target}.docx`, bytes);
  const zip = await JSZip.loadAsync(bytes); const xml = xml2js(await zip.file('word/document.xml').async('string')); const text = textOf(xml);
  assert.equal(all(xml, 'w:sectPr').length, target === 'combined' ? 5 : 2);
  for (const id of target === 'combined' ? ['theory','method'] : target === 'bab2' ? ['theory'] : ['method']) {
    const first = result.sections[id].split('\n\n')[0]; const para = all(xml, 'w:p').find(p => textOf(p) === first); assert(para);
    assert.equal(all(para, 'w:spacing')[0].attributes['w:line'], '480'); assert.equal(all(para, 'w:ind')[0].attributes['w:firstLine'], '850');
  }
  assert(text.includes('Boston: Pearson'));
  if (target !== 'bab2') { const term = all(xml, 'w:r').find(r => textOf(r) === 'explanatory'); assert(term && all(term,'w:i').length, 'Foreign methodological terms are italic in exported Word'); }
  assert.equal(all(xml,'w:pgNumType').filter(n => n.attributes['w:fmt']==='decimal' && n.attributes['w:start']==='1').length,1);
  for(const s of all(xml,'w:sectPr'))assert.equal(all(s,'w:pgMar')[0].attributes['w:left'],'2268');
}
console.log('PASS title/context generation, 10 subchapters, template upgrade, manual prose preservation, source grounding, polish fact/citation/number guards, validated API boundary, generated DOCX and numbering');
