import { generateOutline, normalizeInput } from "@/lib/makalah-engine";

export async function POST(request: Request) {
  try {
    const input = normalizeInput(await request.json());
    const result = await generateOutline(input);
    return Response.json(result);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Gagal membuat outline." },
      { status: 400 }
    );
  }
}
