import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import JSZip from 'jszip';
import { xml2js } from 'xml-js';
import { defaultBab1State } from '../lib/thesis/bab1Store.ts';
import { emptyProposal, loadProposal } from '../lib/thesis/proposal.ts';
import { generationInputSchema, localGeneration } from '../lib/thesis/proposalGeneration.ts';
import { applyImportedStudies, mergeStudyRows, parseStudyText, studyNarrative, suppliedStudies, validateImportedStudies } from '../lib/thesis/priorStudies.ts';
import { exportProposalDocx } from '../lib/thesis/proposalDocx.ts';
import { POST as importRoute } from '../app/api/proposal/studies/route.ts';
import { POST as generationRoute } from '../app/api/proposal/generate/route.ts';
import { getOpenAIClient } from '../lib/ai/openai.ts';

const thesis = { x1: 'Harga', x2: 'Promosi', y: 'Keputusan Pembelian', objek: 'Gyfin Sock' };
const bab1 = { ...defaultBab1State, namaObjek: thesis.objek };
const original = emptyProposal();
const imported = applyImportedStudies(original, suppliedStudies, thesis, thesis.objek, true);
assert.equal(imported.added,10); assert.equal(imported.proposal.studies.length,10);
assert.equal(original.studies.length,1); assert.equal(original.sections.studies,'');
assert.equal(imported.proposal.references.split('\n').length,10);
assert(imported.proposal.sections.studies.includes('Gyfin Sock'));
assert(imported.proposal.sections.studies.includes('Harga memberikan arah pengaruh negatif'));
assert(imported.proposal.sections.studies.includes('Kajian literatur'));
assert(imported.proposal.sections.studies.includes('Verifikasi tahun terbit'));
assert(imported.proposal.studies[2].author.includes('Rumahorbo'));
assert(imported.proposal.studies[4].author.includes('Juhari'));
const edited = structuredClone(imported.proposal); edited.studies[0].result = 'Temuan sudah diperiksa sendiri.'; edited.sections.studies='Narasi asli peneliti.';
const again = applyImportedStudies(edited,suppliedStudies,thesis,thesis.objek,false);
assert.equal(again.added,0); assert.equal(again.proposal.studies.length,10);
assert.equal(again.proposal.studies[0].result,'Temuan sudah diperiksa sendiri.');
assert.equal(again.proposal.sections.studies,'Narasi asli peneliti.');
assert.equal(again.proposal.references,edited.references);
assert.throws(()=>mergeStudyRows(Array.from({length:50},(_,i)=>({...suppliedStudies[0],title:`Studi ${i}`})),[suppliedStudies[1]]),/50/);
const changedTitle = studyNarrative(suppliedStudies,{...thesis,x1:'Kualitas Produk',x2:'Kualitas Pelayanan',y:'Kepuasan Konsumen'},'Objek Baru');
assert(changedTitle.includes('Kualitas Produk dan Kualitas Pelayanan dengan Kepuasan Konsumen'));
assert(changedTitle.includes('Objek Baru'));
const legacyRow = { author:'Peneliti lama (2024)', title:'Judul lama',method:'Survei',result:'Hasil lama',comparison:'Catatan lama' };
global.window={}; global.localStorage={ getItem:()=>JSON.stringify({...emptyProposal(),studies:[legacyRow,suppliedStudies[0]]}) };
try { const loaded=loadProposal(); assert.equal(loaded.studies[0].journal,''); assert.equal(loaded.studies[0].result,'Hasil lama'); assert.equal(loaded.studies[1].journal,suppliedStudies[0].journal); } finally { delete global.window;delete global.localStorage; }
const input={ thesis,bab1,proposal:imported.proposal,scope:'studies',mode:'generate' };
assert(generationInputSchema.safeParse(input).success);
assert.equal(localGeneration(input).sections.studies,studyNarrative(suppliedStudies,thesis,thesis.objek));
assert.equal(localGeneration(input).referencesToAdd.length,10);
const labelled='Peneliti: Peneliti Uji (2024)\nJudul: Pengaruh Harga terhadap Keputusan Pembelian\nJurnal: Jurnal Uji, 1(1)\nHasil: Harga berpengaruh negatif.\nLanjutan temuan sesuai jurnal.\n\nPeneliti: Peneliti Kedua (2023)\nJudul: Promosi dan Keputusan Pembelian\nHasil: Promosi tidak berpengaruh signifikan.';
assert.equal(parseStudyText(labelled).length,2);
assert.equal(parseStudyText(labelled)[0].method,'');
assert(parseStudyText(labelled)[0].result.includes('Lanjutan temuan'));
assert.equal(parseStudyText('Hasil: Tidak ada identitas penelitian'),null);
assert.equal(parseStudyText(JSON.stringify(suppliedStudies)).length,10);
assert.equal(validateImportedStudies({ studies:[{author:'Peneliti Uji (2024)',title:'Pengaruh Harga terhadap Keputusan Pembelian',result:'Harga berpengaruh negatif.'}] },labelled).length,1);
assert.equal(validateImportedStudies({ studies:[{author:'Peneliti Fiktif (2028)',title:'Judul baru',result:'Positif.'}] },labelled),null);
assert.equal(validateImportedStudies({ studies:[{author:'Peneliti Uji (2024)',title:'Pengaruh Harga terhadap Keputusan Pembelian',result:'Harga berpengaruh positif dan signifikan.'}] },labelled),null);
const priorKey=process.env.OPENAI_API_KEY; delete process.env.OPENAI_API_KEY;
try {
 const response=await importRoute(new Request('http://localhost/api/proposal/studies',{method:'POST',headers:{origin:'http://localhost'},body:JSON.stringify({text:labelled})}));
 assert.equal(response.status,200); const data=await response.json();assert.equal(data.engine,'structured');assert.equal(data.studies.length,2);assert.equal(response.headers.get('cache-control'),'no-store');
 const unavailable=await importRoute(new Request('http://localhost/api/proposal/studies',{method:'POST',body:JSON.stringify({text:'Teks jurnal tanpa pembatas atau format berlabel.'})}));assert.equal(unavailable.status,422);
 const bad=await importRoute(new Request('http://localhost/api/proposal/studies',{method:'POST',body:'{bad'}));assert.equal(bad.status,400);
 const cross=await importRoute(new Request('http://localhost/api/proposal/studies',{method:'POST',headers:{origin:'https://other.test'},body:JSON.stringify({text:labelled})}));assert.equal(cross.status,403);
 const long=await importRoute(new Request('http://localhost/api/proposal/studies',{method:'POST',body:'x'.repeat(150001)}));assert.equal(long.status,413);
 const regenerate=await generationRoute(new Request('http://localhost/api/proposal/generate',{method:'POST',body:JSON.stringify({...input,proposal:edited})}));
 const actual=await regenerate.json();assert.equal(regenerate.status,200);assert(actual.sections.studies.includes('Temuan sudah diperiksa sendiri.'));assert(!actual.sections.studies.includes('Narasi asli peneliti.'));
}finally{if(priorKey!==undefined)process.env.OPENAI_API_KEY=priorKey;}
process.env.OPENAI_API_KEY='test-placeholder-not-a-secret';
const client=getOpenAIClient(); const oldCreate=client.responses.create;
const raw='Peneliti Uji (2024) menulis Pengaruh Harga terhadap Keputusan Pembelian. Jurnal Uji. Harga berpengaruh negatif.';
try {
 client.responses.create=async()=>({output_text:JSON.stringify({studies:[{author:'Peneliti Uji (2024)',title:'Pengaruh Harga terhadap Keputusan Pembelian',journal:'Jurnal Uji',result:'Harga berpengaruh negatif.'}]})});
 const response=await importRoute(new Request('http://localhost/api/proposal/studies',{method:'POST',body:JSON.stringify({text:raw})}));assert.equal(response.status,200);assert.equal((await response.json()).engine,'ai');
 client.responses.create=async()=>({output_text:JSON.stringify({studies:[{author:'Peneliti Fiktif (2028)',title:'Judul Fiktif'}]})});
 const responseBad=await importRoute(new Request('http://localhost/api/proposal/studies',{method:'POST',body:JSON.stringify({text:raw})}));assert.equal(responseBad.status,422);
}finally{client.responses.create=oldCreate;if(priorKey!==undefined)process.env.OPENAI_API_KEY=priorKey;else delete process.env.OPENAI_API_KEY;}
const all=(node,name)=>[...(node.name===name?[node]:[]),...(node.elements||[]).flatMap(c=>all(c,name))];
const textOf=node=>all(node,'w:t').map(t=>(t.elements||[]).map(e=>e.text||'').join('')).join('');
await fs.mkdir('/tmp/prior-studies-evidence',{recursive:true});
for(const target of ['bab2','combined']){
 const bytes=Buffer.from(await(await exportProposalDocx(imported.proposal,thesis,bab1,target)).arrayBuffer());
 await fs.writeFile(`/tmp/prior-studies-evidence/studies-${target}.docx`,bytes);
 const zip=await JSZip.loadAsync(bytes), xml=xml2js(await zip.file('word/document.xml').async('string'));
 const table=all(xml,'w:tbl').find(n=>textOf(n).includes('Nama dan Judul Penelitian'));
 assert(table);assert.equal(all(table,'w:tr').length,11);assert.equal(all(all(table,'w:tr')[0],'w:tc').length,4);
 assert.equal(all(table,'w:tblHeader').length,1);
 assert.equal(all(table,'w:tblLayout')[0].attributes['w:type'],'fixed');
 assert.equal(all(table,'w:gridCol').reduce((a,n)=>a+Number(n.attributes['w:w']),0),7937);
 assert.equal(all(table,'w:cantSplit').filter(n=>!['0','false'].includes(n.attributes?.['w:val'])).length,1,'Only the header is locked; long body rows may flow across pages');
 for(const row of suppliedStudies){assert(textOf(table).includes(row.author));assert(textOf(table).includes(row.journal));assert(textOf(table).includes(row.result));assert(textOf(xml).includes(row.reference));}
 for(const size of all(table,'w:sz'))assert.equal(size.attributes['w:val'],'24');
 for(const spacing of all(table,'w:spacing'))assert.equal(spacing.attributes['w:line'],'240');
 const template=await exportProposalDocx(imported.proposal,thesis,bab1,target,true);const z=await JSZip.loadAsync(await template.arrayBuffer());assert(!(await z.file('word/document.xml').async('string')).includes('Saputra'));
}
console.log('PASS 10 supplied studies, preserved negative/non-significant claims, journal metadata migration, deduplication/manual edits, title-aware narrative, references, offline and AI import boundaries, rejected invented sources, four-column DOCX, repeat headers and flowing rows');
