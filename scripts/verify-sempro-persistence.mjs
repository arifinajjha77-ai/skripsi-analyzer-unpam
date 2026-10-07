import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { readDraft, writeDraft, DRAFT_ERROR } from '../lib/draftStorage.ts';
import { loadThesisState, saveThesisState } from '../lib/thesis/store.ts';
import { defaultBab1State, loadBab1State, saveBab1State } from '../lib/thesis/bab1Store.ts';
import { emptyProposal, loadProposal, saveProposal } from '../lib/thesis/proposal.ts';
import { createProject, saveProjects, snapshotCurrentState, restoreSnapshot, getActiveProjectId, loadProjects, saveCurrentStateToProject, setActiveProjectId } from '../lib/projectStore.ts';
import { createSemproBackup, restoreSemproBackup } from '../lib/semproPersistence.ts';
import { parseSemproBackup } from '../lib/semproBackup.ts';
import { encryptBackup, decryptBackup, vaultPrefix } from '../lib/semproVault.ts';
import { clearState, saveState } from '../lib/store.ts';
import { GET, POST } from '../app/api/sempro-backup/route.ts';

class Storage {
  values = new Map();
  failKey;
  getItem(k) { return this.values.get(k) ?? null; }
  setItem(k, v) { if (this.failKey === k) { this.failKey = undefined; throw new Error('quota'); } this.values.set(k, String(v)); }
  removeItem(k) { this.values.delete(k); }
  clear() { this.values.clear(); }
}
globalThis.window = new EventTarget();
globalThis.localStorage = new Storage();
globalThis.sessionStorage = new Storage();
const thesis = { x1: 'Harga', x2: 'Promosi', y: 'Keputusan Pembelian', objek: 'Objek Uji' };
const bab1 = { ...defaultBab1State, namaObjek: 'Objek Uji', lokasi: 'Depok', fenomena: 'Catatan manual peneliti.' };
const proposal = emptyProposal();
proposal.sections.theory = 'Isi manual yang tidak boleh hilang.';
proposal.sections.sample = 'Sampel belum ditetapkan oleh peneliti.';
proposal.studies = [{ author: 'Peneliti (2024)', title: 'Judul kajian uji', method: 'Survei', result: 'Temuan yang dikirim peneliti.', comparison: 'Variabel sama.', journal: 'Jurnal uji', reference: '' }];
sessionStorage.setItem('thesis_generator_state', JSON.stringify(thesis));
sessionStorage.setItem('bab1_state', JSON.stringify(bab1));
assert.deepEqual(loadThesisState(), thesis);
assert.equal(loadBab1State().fenomena, bab1.fenomena);
assert.equal(sessionStorage.getItem('bab1_state'), null, 'Legacy tab storage migrated only after durable write');
assert(saveProposal(proposal));
sessionStorage = new Storage(); // A new tab has no old session data.
assert.deepEqual(loadThesisState(), thesis);
assert.equal(loadBab1State().lokasi, 'Depok');
assert.deepEqual(loadProposal(), proposal);
const project = createProject('Sempro uji');
saveProjects([project]); setActiveProjectId(project.id);
saveBab1State({ ...bab1, fenomena: 'Revisi manual.' });
saveCurrentStateToProject(project.id);
assert.equal(JSON.parse(loadProjects()[0].snapshot.bab1_state).fenomena, 'Revisi manual.');
assert.deepEqual(JSON.parse(snapshotCurrentState().smartcampus_proposal_feb2021_v1), proposal, 'Projects include BAB II–III');
saveState({ fileName: 'analisis.xlsx' }); clearState();
assert.equal(loadBab1State().fenomena, 'Revisi manual.', 'Reset analysis leaves research drafts intact');
assert.deepEqual(loadProposal(), proposal);
const saved = createSemproBackup();
const code = randomBytes(32).toString('hex');
const encrypted = encryptBackup(code, saved);
assert(!encrypted.includes('Isi manual'));
assert(!encrypted.includes('Objek Uji'));
assert(!vaultPrefix(code).includes(code));
assert.deepEqual(decryptBackup(code, encrypted), saved);
assert.throws(() => decryptBackup(randomBytes(32).toString('hex'), encrypted));
assert.throws(() => parseSemproBackup({ ...saved, snapshot: {} }));
assert.throws(() => parseSemproBackup({ ...saved, snapshot: { ...saved.snapshot, unexpected: 'x' } }));
assert.throws(() => parseSemproBackup({ ...saved, snapshot: { thesis_generator_state: '{broken' } }));
assert.throws(() => parseSemproBackup({ ...saved, snapshot: { thesis_generator_state: JSON.stringify({ ...thesis, x1: 123 }) } }));
const before = snapshotCurrentState();
localStorage.failKey = 'bab1_state';
assert.throws(() => restoreSnapshot({ ...before, thesis_generator_state: JSON.stringify({ ...thesis, x1: 'Gagal' }) }));
assert.deepEqual(snapshotCurrentState(), before, 'Failed restore rolls back earlier writes');
let warned = false;
window.addEventListener(DRAFT_ERROR, () => { warned = true; });
localStorage.failKey = 'thesis_generator_state';
assert.equal(writeDraft('thesis_generator_state', 'bad'), false);
assert(warned, 'Storage errors are surfaced');
const count = loadProjects().length;
const newDraft = { ...saved, snapshot: { ...saved.snapshot, thesis_generator_state: JSON.stringify({ ...thesis, objek: 'Cadangan lain' }) } };
restoreSemproBackup(newDraft, code);
assert.equal(loadProjects().length, count + 1, 'Recovery creates a new project');
assert.notEqual(getActiveProjectId(), project.id);
assert.equal(JSON.parse(loadProjects().find(p => p.id === project.id).snapshot.bab1_state).fenomena, 'Revisi manual.', 'Previous manual data preserved');
assert.deepEqual(loadProposal(), proposal);
localStorage = new Storage(); sessionStorage = new Storage(); // Completely fresh browser.
restoreSemproBackup(saved, code);
assert.deepEqual(loadThesisState(), thesis);
assert.deepEqual(loadProposal(), proposal);
assert.equal(loadBab1State().fenomena, 'Revisi manual.');
assert.equal(readDraft('skripsi_analyzer_state'), null, 'Sempro backups exclude respondent/analysis datasets');
const noAuth = await GET(new Request('http://localhost/api/sempro-backup'));
assert.equal(noAuth.status, 401);
const previousToken = process.env.BLOB_READ_WRITE_TOKEN;
process.env.BLOB_READ_WRITE_TOKEN = 'test-placeholder';
assert.equal((await POST(new Request('http://localhost/api/sempro-backup', { method: 'POST', headers: { Authorization: `Bearer ${code}`, Origin: 'https://other.example' }, body: JSON.stringify(saved) }))).status, 403);
assert.equal((await POST(new Request('http://localhost/api/sempro-backup', { method: 'POST', headers: { Authorization: `Bearer ${code}` }, body: JSON.stringify({ ...saved, snapshot: {} }) }))).status, 400);
if (previousToken) process.env.BLOB_READ_WRITE_TOKEN = previousToken; else delete process.env.BLOB_READ_WRITE_TOKEN;
console.log('PASS legacy migration, fresh tabs/browsers, BAB I–III project snapshots, private encrypted backups, invalid data rejection, rollback, scoped reset and non-destructive recovery.');
