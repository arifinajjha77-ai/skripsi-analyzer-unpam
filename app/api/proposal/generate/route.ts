import { generateJsonWithOpenAI } from '@/lib/ai/openai';
import { generatedReferenceAdditions, generationInputSchema, generationPrompt, generationTargets, localGeneration, polishProse, validateGeneratedSections, type GenerationInput } from '@/lib/thesis/proposalGeneration';

export const maxDuration = 60;
export async function POST(request: Request) {
  if (request.headers.get('origin') && request.headers.get('origin') !== new URL(request.url).origin) return Response.json({ error: 'Permintaan harus berasal dari halaman SmartCampus.' }, { status: 403 });
  try {
    const raw = await request.text();
    if (raw.length > 250000) return Response.json({ error: 'Naskah terlalu panjang. Generate satu subbab terlebih dahulu.' }, { status: 413 });
    const parsed = generationInputSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return Response.json({ error: 'Lengkapi variabel X1, X2, Y dan objek penelitian pada BAB I, lalu periksa data isian.' }, { status: 400 });
    const input: GenerationInput = parsed.data;
    const fallback = localGeneration(input);
    if (!generationTargets(input).length) return Response.json(fallback);
    const ai = await generateJsonWithOpenAI<unknown>(generationPrompt(input), { timeoutMs: 40000, signal: request.signal, maxOutputTokens: 10000 });
    const validated = ai ? validateGeneratedSections(ai.data, input) : null;
    const sections = validated && input.mode === 'polish' ? Object.fromEntries(Object.entries(validated).map(([id, text]) => [id, polishProse(text)])) : validated;
    return Response.json(sections ? { ...fallback, sections, referencesToAdd: generatedReferenceAdditions(sections, input), engine: 'ai' } : fallback, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ error: 'Data generate tidak dapat dibaca. Muat ulang halaman dan coba kembali.' }, { status: 400 });
  }
}
