import { generateJsonWithOpenAI } from '@/lib/ai/openai';
import { parseStudyText, studyImportInputSchema, studyImportPrompt, validateImportedStudies } from '@/lib/thesis/priorStudies';

export const maxDuration = 60;
export async function POST(request: Request) {
  if (request.headers.get('origin') && request.headers.get('origin') !== new URL(request.url).origin) return Response.json({ error: 'Permintaan harus berasal dari halaman SmartCampus.' }, { status: 403 });
  try {
    const raw = await request.text();
    if (raw.length > 150000) return Response.json({ error: 'Teks terlalu panjang. Impor beberapa penelitian terlebih dahulu.' }, { status: 413 });
    const parsed = studyImportInputSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return Response.json({ error: 'Tempel teks penelitian (20–80.000 karakter) terlebih dahulu.' }, { status: 400 });
    const { text } = parsed.data;
    const direct = parseStudyText(text);
    if (direct) return Response.json({ studies: direct, engine: 'structured', warnings: ['Periksa kembali setiap baris terhadap teks sumber sebelum menggunakannya.'] }, { headers: { 'Cache-Control': 'no-store' } });
    const ai = await generateJsonWithOpenAI<unknown>(studyImportPrompt(text), { timeoutMs: 40000, signal: request.signal, maxOutputTokens: 10000 });
    const studies = ai && validateImportedStudies(ai.data, text);
    if (!studies) return Response.json({ error: 'Teks belum dapat dipisahkan dengan akurat. Gunakan format Peneliti:, Judul:, Jurnal:, Hasil:; pisahkan setiap penelitian dengan satu baris kosong. Pilihan 10 penelitian yang dikirim tetap dapat dipakai tanpa koneksi generator.' }, { status: 422 });
    return Response.json({ studies, engine: 'ai', warnings: ['Periksa jumlah dan isi baris terhadap teks sumber. Metode dan identitas yang tidak tercantum tidak ditebak.', ...(studies.some(r => !/\b\d{4}\b/.test(r.author)) ? ['Tahun terbit pada sebagian peneliti belum terbaca. Lengkapi dari jurnal asli.'] : [])] }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ error: 'Data impor tidak dapat dibaca. Teks dan tabel sebelumnya tetap tersedia.' }, { status: 400 });
  }
}
