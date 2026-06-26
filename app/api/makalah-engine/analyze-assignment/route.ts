import { analyzeAssignmentText } from "@/lib/makalah-engine/assignmentAnalyzer";
import { parseAssignmentFile } from "@/lib/makalah-engine/assignmentParser";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("assignmentFile");
    const userNotes = String(formData.get("userNotes") || "");

    if (!(file instanceof File)) {
      return Response.json({ ok: false, error: "File tugas dosen belum dipilih." }, { status: 400 });
    }

    const text = await parseAssignmentFile(file);
    const result = await analyzeAssignmentText(text, userNotes);

    return Response.json({
      ok: true,
      analysis: result.analysis,
      meta: {
        fallback: result.fallback,
        model: result.model,
        extractedCharacters: text.length,
      },
    });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "Gagal menganalisis tugas dosen." },
      { status: 400 }
    );
  }
}
