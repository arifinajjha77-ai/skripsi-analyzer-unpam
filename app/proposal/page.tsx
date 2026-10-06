"use client";

import Link from 'next/link';
import Image from 'next/image';
import { PROPOSAL_DIAGRAM_PNG } from '@/lib/thesis/proposalDiagram';
import { useEffect, useRef, useState } from 'react';
import { Download, FileText, ArrowRight, Sparkles, RotateCcw, LoaderCircle } from 'lucide-react';
import { defaultBab1State, loadBab1State, saveBab1State, type Bab1State } from '@/lib/thesis/bab1Store';
import { loadThesisState, saveThesisState, type ThesisState } from '@/lib/thesis/store';
import { emptyOperation, emptyProposal, emptyStudy, loadProposal, PROPOSAL_SECTIONS, saveProposal, type Operation, type ProposalState, type Study } from '@/lib/thesis/proposal';
import type { ProposalExport } from '@/lib/thesis/proposalDocx';
import { isStarterSection, localGeneration, researchTitle, type GenerationInput, type GenerationMode, type GenerationResult, type GenerationScope } from '@/lib/thesis/proposalGeneration';
import { referenceAgeWarnings } from '@/lib/templates/feb2021';

const inputClass = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100';
const buttonClass = 'inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50';
const cardClass = 'rounded-xl border border-slate-200 bg-white p-4 md:p-6';
const studyFields: { key: keyof Study; label: string }[] = [{ key: 'author', label: 'Peneliti dan tahun' }, { key: 'title', label: 'Judul dan sumber jurnal' }, { key: 'method', label: 'Metode penelitian' }, { key: 'result', label: 'Hasil penelitian' }, { key: 'comparison', label: 'Persamaan dan perbedaan' }];
const operationFields: { key: keyof Operation; label: string }[] = [{ key: 'variable', label: 'Variabel' }, { key: 'definition', label: 'Definisi operasional' }, { key: 'indicators', label: 'Indikator' }, { key: 'scale', label: 'Skala pengukuran' }, { key: 'source', label: 'Sumber teori' }];

function GeneratedDownloadButton({ disabled, busy, onClick }: { disabled: boolean; busy: boolean; onClick: () => void }) {
  return <button type="button" disabled={disabled} className={`${buttonClass} w-full bg-emerald-700 hover:bg-emerald-800 sm:w-auto`} onClick={onClick}>
    {busy ? <LoaderCircle aria-hidden="true" className="h-4 w-4 shrink-0 animate-spin" /> : <Download aria-hidden="true" className="h-4 w-4 shrink-0" />}
    {busy ? 'Menyiapkan Word gabungan…' : 'Unduh hasil generate gabungan BAB I–III'}
  </button>;
}

function RowEditor<T extends object>({ title, rows, fields, onChange, create, disabled }: { disabled: boolean; title: string; rows: T[]; fields: { key: keyof T; label: string }[]; onChange: (rows: T[]) => void; create: () => T }) {
  return <div className="mt-5 border-t border-slate-200 pt-4">
    <h3 className="mb-3 font-semibold text-slate-800">{title}</h3>
    <div className="space-y-3">{rows.map((row, index) => <fieldset key={index} disabled={disabled} className="rounded-lg border border-slate-200 p-3">
      <legend className="px-1 text-sm font-medium">{title} #{index + 1}</legend>
      <div className="grid gap-3 sm:grid-cols-2">{fields.map(field => <label key={String(field.key)} className="block text-sm text-slate-700">
        {field.label}<textarea aria-label={`${title} ${index + 1}: ${field.label}`} className={`${inputClass} mt-1`} rows={2} value={String(row[field.key] ?? '')} onChange={e => onChange(rows.map((r, i) => i === index ? { ...r, [field.key]: e.target.value } : r))} />
      </label>)}</div>
      <button type="button" className="mt-2 text-sm text-red-700 underline" onClick={() => onChange(rows.filter((_, i) => i !== index))}>Hapus baris {index + 1}</button>
    </fieldset>)}</div>
    <button type="button" disabled={disabled} className="mt-3 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50" onClick={() => onChange([...rows, create()])}>Tambah {title.toLowerCase()}</button>
  </div>;
}

export default function ProposalPage() {
  const [proposal, setProposal] = useState<ProposalState>(emptyProposal);
  const [thesis, setThesis] = useState<ThesisState>({ x1: '', x2: '', y: '', objek: '' });
  const [bab1, setBab1] = useState<Bab1State>(defaultBab1State);
  const [chapter, setChapter] = useState<2 | 3>(2);
  const [templateTarget, setTemplateTarget] = useState<ProposalExport>('combined');
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [generating, setGenerating] = useState<string | null>(null);
  const [generationNotes, setGenerationNotes] = useState<string[]>([]);
  const [undoSnapshot, setUndoSnapshot] = useState<ProposalState | null>(null);
  const generationAbort = useRef<AbortController | null>(null);
  const working = busy || Boolean(generating);
  const [error, setError] = useState('');
  useEffect(() => {
    const timer = window.setTimeout(() => { setProposal(loadProposal()); setThesis(loadThesisState()); setBab1(loadBab1State()); setReady(true); }, 0);
    return () => { window.clearTimeout(timer); generationAbort.current?.abort(); };
  }, []);
  function updateProposal(next: ProposalState) {
    setProposal(next); setUndoSnapshot(null);
    setNotice(saveProposal(next) ? 'BAB II–III tersimpan otomatis di browser ini.' : 'Penyimpanan browser tidak tersedia. Unduh draf sebelum meninggalkan halaman.');
  }
  function updateThesis(key: keyof ThesisState, value: string) {
    const next = { ...thesis, [key]: value }; setThesis(next); saveThesisState(next);
    if (key === 'objek') { const nextBab1 = { ...bab1, namaObjek: value }; setBab1(nextBab1); saveBab1State(nextBab1); }
  }
  async function generate(scope: GenerationScope, mode: GenerationMode = 'generate') {
    if (![thesis.x1, thesis.x2, thesis.y, bab1.namaObjek || thesis.objek].every(v => v.trim())) {
      setError('Lengkapi variabel X1, X2, Y, dan objek penelitian pada BAB I terlebih dahulu.'); return;
    }
    const input: GenerationInput = { thesis, bab1, proposal, scope, mode };
    const previous = proposal;
    const controller = new AbortController(); generationAbort.current = controller;
    const timeout = window.setTimeout(() => controller.abort('timeout'), 55000);
    setGenerating(`${scope}-${mode}`); setError(''); setGenerationNotes([]);
    let result: GenerationResult;
    let connectionFallback = false;
    try {
      const response = await fetch('/api/proposal/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input), signal: controller.signal });
      if (!response.ok) {
        if (response.status >= 500) throw new Error('Koneksi generator terganggu.');
        const body = await response.json(); setError(body.error || 'Generate gagal. Periksa data penelitian.'); return;
      }
      result = await response.json();
      if (!result.sections || typeof result.sections !== 'object') throw new Error('Respons generator tidak lengkap.');
    } catch {
      if (controller.signal.aborted && controller.signal.reason !== 'timeout') { setNotice('Generate dibatalkan. Tulisan sebelumnya tetap tersimpan.'); return; }
      result = localGeneration(input); connectionFallback = true;
    } finally {
      window.clearTimeout(timeout); generationAbort.current = null; setGenerating(null);
    }
    const count = Object.keys(result.sections).length;
    if (!count) { setNotice(mode === 'polish' ? 'Isi atau generate narasi terlebih dahulu sebelum memperhalus bahasa.' : 'Narasi yang sudah ditulis tetap dipertahankan. Gunakan Generate ulang pada subbab yang ingin diganti.'); return; }
    if (mode === 'polish' && Object.entries(result.sections).every(([id, text]) => proposal.sections[id as keyof typeof proposal.sections] === text)) { setNotice('Pemeriksaan bahasa selesai. Tidak ada perubahan bahasa yang dapat diterapkan tanpa mengubah isi.'); return; }
    const references = result.referencesToAdd?.length ? Array.from(new Set([...proposal.references.split(/\n+/).map(r => r.trim()).filter(Boolean), ...result.referencesToAdd])).sort((a,b) => a.localeCompare(b, 'id')).join('\n') : proposal.references;
    updateProposal({ ...proposal, sections: { ...proposal.sections, ...result.sections }, references });
    setUndoSnapshot(previous); setGenerationNotes(result.warnings || []);
    setNotice(`${count} subbab ${mode === 'polish' ? 'sudah diperhalus' : 'berhasil digenerate'} mengikuti judul dan konteks BAB I–II.${connectionFallback ? ' Koneksi terganggu; draf disusun dari data yang tersedia di browser.' : result.engine === 'contextual' ? ' Draf disusun otomatis dari data yang tersedia; sumber dan rincian yang belum ada tetap ditandai.' : ''}`);
  }
  async function download(target: ProposalExport, template = false) {
    setBusy(true); setError('');
    try {
      const { exportProposalDocx } = await import('@/lib/thesis/proposalDocx');
      const blob = await exportProposalDocx(proposal, thesis, bab1, target, template);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url;
      const name = (bab1.namaObjek || thesis.objek || 'Penelitian').replace(/[^\p{L}\p{N}]+/gu, '-').slice(0, 80);
      const label = { bab1: 'BAB-I', bab2: 'BAB-II', bab3: 'BAB-III', combined: 'BAB-I-III' }[target];
      a.download = `${template ? 'Template' : 'Draf'}-Sempro-${label}-${template ? 'FEB-2021' : name}.docx`;
      document.body.appendChild(a); a.click(); a.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setNotice(`${template ? 'Template' : 'Draf'} ${label} berhasil diunduh.${target === 'combined' ? ' Daftar isi sudah disertakan. Di Microsoft Word, pilih Perbarui seluruh tabel agar nomor halaman mengikuti naskah; tanda — menunggu pembaruan.' : ''} Bagian bertanda [kurung siku] masih perlu dilengkapi.`);
    } catch (e) { setError(e instanceof Error ? e.message : 'Unduhan gagal. Silakan coba lagi.'); }
    finally { setBusy(false); }
  }
  const context: GenerationInput = { thesis, bab1, proposal, scope: 'all', mode: 'generate' };
  const filled = PROPOSAL_SECTIONS.filter(s => !isStarterSection(proposal.sections[s.id], s.id, context)).length;
  const incomplete = PROPOSAL_SECTIONS.filter(s => !proposal.sections[s.id].trim() || /\[[^\]]+\]/.test(proposal.sections[s.id])).length;
  const referenceWarnings = referenceAgeWarnings(proposal.references.split(/\n+/).map(r => r.trim()).filter(Boolean));
  return <div className="mx-auto max-w-5xl space-y-5">
    <header><h1 className="text-2xl font-bold text-slate-900">Proposal Sempro · BAB I–III</h1><p className="mt-2 text-sm text-slate-600">Lanjutkan BAB I ke tinjauan pustaka dan metode penelitian. Editor dan template ini menggunakan susunan penelitian kuantitatif FEB UNPAM 2021.</p></header>
    <section className={cardClass} aria-labelledby="research-heading">
      <h2 id="research-heading" className="mb-3 font-semibold text-slate-900">Data penelitian dari BAB I</h2>
      <div className="grid gap-3 sm:grid-cols-2">{([{ key: 'x1', label: 'Variabel X1' }, { key: 'x2', label: 'Variabel X2' }, { key: 'y', label: 'Variabel Y' }, { key: 'objek', label: 'Objek penelitian' }] as const).map(f => <label key={f.key} className="block text-sm text-slate-700">{f.label}<input className={`${inputClass} mt-1`} disabled={!ready || working} value={f.key === 'objek' ? bab1.namaObjek || thesis.objek : thesis[f.key]} onChange={e => updateThesis(f.key, e.target.value)} /></label>)}</div>
      <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm"><span className="block text-xs text-slate-500">Judul acuan dari BAB I</span><strong className="mt-1 block text-slate-800">{researchTitle(thesis, bab1)}</strong><p className="mt-1 text-xs text-slate-500">Generate mengikuti judul, variabel, objek, dan naskah BAB II yang tersimpan.</p></div>
      <Link href="/latar-belakang" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-blue-700 underline">Edit data dan latar belakang BAB I <ArrowRight className="h-4 w-4" /></Link>
    </section>
    <section className={cardClass} aria-labelledby="download-heading">
      <h2 id="download-heading" className="font-semibold text-slate-900">Unduh Word dan template</h2>
      <p className="mb-4 mt-1 text-sm text-slate-600">Unduhan gabungan berisi daftar isi, BAB I–III, dan daftar pustaka. Sampul dan kata pengantar dapat ditambahkan sesuai naskah Anda. BAB I memakai data di menu Latar Belakang dan menambahkan 1.5 Sistematika Penulisan.</p>
      <div className="flex flex-wrap gap-2">{([{ key: 'bab1', label: 'Unduh BAB I' }, { key: 'bab2', label: 'Unduh BAB II' }, { key: 'bab3', label: 'Unduh BAB III' }, { key: 'combined', label: 'Unduh gabungan BAB I–III' }] as const).map(item => <button key={item.key} type="button" disabled={!ready || working} className={buttonClass} onClick={() => download(item.key)}><Download className="h-4 w-4" />{item.label}</button>)}</div>
      <div className="mt-4 flex flex-wrap items-end gap-2 border-t border-slate-200 pt-4"><label className="text-sm text-slate-700" htmlFor="template-target">Pilih template<select id="template-target" className={`${inputClass} mt-1`} value={templateTarget} onChange={e => setTemplateTarget(e.target.value as ProposalExport)}><option value="combined">Isi BAB I–III</option><option value="bab1">BAB I</option><option value="bab2">BAB II</option><option value="bab3">BAB III</option></select></label><button className={`${buttonClass} bg-slate-800 hover:bg-slate-900`} disabled={!ready || working} onClick={() => download(templateTarget, true)}><FileText className="h-4 w-4" />Unduh template Word</button></div>
      <p className="mt-3 text-xs text-slate-500">A4, Times New Roman 12, isi 2 spasi, tabel 1 spasi. Daftar isi 1,5 spasi, titik penghubung, dan nomor rata kanan; halaman awal memakai Romawi. BAB I dimulai dari 1 dan nomor berlanjut antar bab; halaman pembuka bab di tengah bawah, halaman berikutnya di kanan atas.</p>
      <p className="mt-2 text-xs text-slate-500">Di Microsoft Word, klik kanan daftar isi → Perbarui Bidang → Perbarui seluruh tabel. Lakukan kembali setelah mengubah naskah atau menambah halaman awal. Tanda — pada daftar isi akan diganti nomor halaman sebenarnya.</p>
    </section>
    {notice && <p role="status" className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800">{notice}</p>}
    {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><strong>Draf perlu dilengkapi</strong><p className="mt-1">{filled}/10 subbab memiliki narasi; {incomplete} bagian masih kosong atau berisi petunjuk. Sumber teori, hasil jurnal, populasi, sampel, dan waktu penelitian harus diisi dari data Anda. Bagian kosong tetap tampil sebagai [petunjuk] di Word.</p></section>
    <section className={cardClass} aria-labelledby="generate-heading"><h2 id="generate-heading" className="font-semibold text-slate-900">Generate otomatis sesuai judul</h2><p className="mb-4 mt-1 text-sm text-slate-600">Susun paragraf BAB II–III dari data BAB I, teori, dan penelitian terdahulu yang sudah diisi. Bahasa dibuat alami dan akademik. Generate per bab mempertahankan narasi yang sudah Anda tulis; petunjuk template akan diganti dengan draf.</p>
      <div className="flex flex-wrap gap-2"><button className={buttonClass} disabled={!ready || working} onClick={() => generate('all')}><Sparkles className="h-4 w-4" />Generate otomatis BAB II–III</button><button className={buttonClass} disabled={!ready || working} onClick={() => generate('bab2')}>Generate BAB II</button><button className={buttonClass} disabled={!ready || working} onClick={() => generate('bab3')}>Generate BAB III</button><button className={`${buttonClass} bg-slate-800 hover:bg-slate-900`} disabled={!ready || working} onClick={() => generate(`bab${chapter}` as GenerationScope, 'polish')}>Perhalus bahasa BAB {chapter === 2 ? 'II' : 'III'}</button></div>
      {generating && <div role="status" className="mt-3 flex flex-wrap items-center gap-2 text-sm text-blue-800"><LoaderCircle className="h-4 w-4 animate-spin" />Menyusun paragraf sesuai naskah penelitian…<button className="underline" onClick={() => generationAbort.current?.abort()}>Batalkan generate</button></div>}
      {undoSnapshot && <button disabled={working} className="mt-3 inline-flex items-center gap-1 text-sm text-blue-700 underline" onClick={() => { updateProposal(undoSnapshot); setGenerationNotes([]); setNotice('Tulisan sebelum generate terakhir sudah dipulihkan.'); }}><RotateCcw className="h-4 w-4" />Pulihkan tulisan sebelum generate terakhir</button>}
      {generationNotes.length > 0 && <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-amber-800">{generationNotes.map((note,i) => <li key={i}>{note}</li>)}</ul>}
      <div className="mt-4 border-t border-slate-200 pt-4">
        <GeneratedDownloadButton disabled={!ready || working || filled === 0} busy={busy} onClick={() => download('combined')} />
        <p className="mt-2 text-sm text-slate-600">{filled === 0 ? 'Generate atau isi narasi BAB II–III terlebih dahulu untuk mengunduh hasilnya.' : 'Menggabungkan daftar isi, BAB I yang tersimpan, hasil generate BAB II–III, edit terbaru, tabel, diagram, dan daftar pustaka ke satu file Word.'}</p>
      </div>
      <p className="mt-3 text-xs text-slate-500">Format unduhan tetap FEB UNPAM 2021. Data sampel, waktu penelitian, dan sitasi yang belum tersedia perlu dilengkapi sebelum naskah diajukan.</p>
    </section>
    <nav aria-label="Pilih bab proposal" className="flex gap-2">{([2, 3] as const).map(c => <button key={c} aria-pressed={chapter === c} onClick={() => setChapter(c)} className={`rounded-lg px-4 py-3 text-sm font-semibold ${chapter === c ? 'bg-blue-700 text-white' : 'border border-slate-300 bg-white text-slate-700'}`}>{c === 2 ? 'BAB II · Tinjauan Pustaka' : 'BAB III · Metode Penelitian'}</button>)}</nav>
    {PROPOSAL_SECTIONS.filter(s => s.chapter === chapter).map(s => <section key={s.id} className={cardClass}>
      <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-semibold text-slate-900"><label htmlFor={`section-${s.id}`}>{s.title}</label></h2><button className="inline-flex items-center gap-1 rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-50" disabled={!ready || working} onClick={() => generate(s.id)}><Sparkles className="h-3 w-3" />{isStarterSection(proposal.sections[s.id], s.id, context) ? 'Generate' : 'Generate ulang'} {s.title.split(' ')[0]}</button></div><p id={`hint-${s.id}`} className="mb-3 mt-1 text-sm text-slate-500">{s.hint}</p>
      <textarea id={`section-${s.id}`} aria-describedby={`hint-${s.id}`} disabled={!ready || working} className={`${inputClass} leading-7`} rows={s.id === 'theory' ? 12 : 6} value={proposal.sections[s.id]} placeholder={s.hint} onChange={e => updateProposal({ ...proposal, sections: { ...proposal.sections, [s.id]: e.target.value } })} />
      {s.id === 'studies' && <RowEditor disabled={!ready || working} title="Penelitian terdahulu" rows={proposal.studies} fields={studyFields} create={emptyStudy} onChange={rows => updateProposal({ ...proposal, studies: rows })} />}
      {s.id === 'framework' && <div className="mt-4"><Image src={`data:image/png;base64,${PROPOSAL_DIAGRAM_PNG}`} alt="X1 dan X2 memengaruhi Y secara parsial dan simultan; hipotesis H1, H2, H3" width={900} height={380} unoptimized className="mx-auto h-auto w-full max-w-lg" /><p className="mt-2 text-center text-sm font-medium">Gambar 2.1 Kerangka Berpikir</p><p className="mt-2 text-sm text-slate-600">X1: {thesis.x1 || '[Variabel X1]'} · X2: {thesis.x2 || '[Variabel X2]'} · Y: {thesis.y || '[Variabel Y]'}. Diagram dan keterangan ini disertakan otomatis dalam Word.</p><Link href="/kerangka" className="mt-3 inline-block text-sm text-blue-700 underline">Buka alat bantu kerangka berpikir</Link></div>}
      {s.id === 'operations' && <><RowEditor disabled={!ready || working} title="Operasional variabel" rows={proposal.operations} fields={operationFields} create={emptyOperation} onChange={rows => updateProposal({ ...proposal, operations: rows })} /><p className="mt-3 text-sm text-slate-500">Gunakan <Link href="/operasional" className="text-blue-700 underline">Operasional Variabel</Link> dan <Link href="/kuesioner" className="text-blue-700 underline">Kuesioner</Link> sebagai alat bantu penyusunan instrumen.</p></>}
    </section>)}
    <section className={cardClass}><h2 className="font-semibold text-slate-900"><label htmlFor="proposal-references">Daftar pustaka tambahan BAB II–III</label></h2><p className="mb-3 mt-1 text-sm text-slate-500">Satu entri lengkap per baris. Masukkan hanya sumber yang disitasi dan diverifikasi, maksimal 10 tahun terakhir menurut pedoman. Referensi BAB I ikut digabung dan diurutkan menurut abjad pada unduhan gabungan.</p><textarea id="proposal-references" disabled={!ready || working} className={inputClass} rows={6} placeholder="Penulis. (Tahun). Judul. Kota: Penerbit. / Metadata jurnal lengkap." value={proposal.references} onChange={e => updateProposal({ ...proposal, references: e.target.value })} />{referenceWarnings.length > 0 && <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-amber-800">{referenceWarnings.map((warning, i) => <li key={i}>{warning}</li>)}</ul>}</section>
    <section className={`${cardClass} border-emerald-200 bg-emerald-50`} aria-labelledby="generated-download-heading">
      <h2 id="generated-download-heading" className="font-semibold text-slate-900">Unduh hasil generate</h2>
      <p className="mb-4 mt-1 text-sm text-slate-600">{filled}/10 subbab memiliki narasi. Unduh daftar isi, BAB I–III, dan daftar pustaka dalam satu file Word dengan format FEB UNPAM 2021. Bagian bertanda [kurung siku] masih perlu dilengkapi.</p>
      <GeneratedDownloadButton disabled={!ready || working || filled === 0} busy={busy} onClick={() => download('combined')} />
    </section>
  </div>;
}
