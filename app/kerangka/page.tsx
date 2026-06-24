"use client";

import React, { useState, useEffect, useRef } from "react";
import { loadThesisState, ThesisState } from "@/lib/thesis/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

// ─── SVG Kerangka Berpikir ─────────────────────────────────────────────────────

interface KerangkaSVGProps {
  x1: string;
  x2: string;
  y: string;
}

const W = 700;
const H = 400;
const BOX_W = 200;
const BOX_H = 64;
const Y_BOX_W = 220;
const Y_BOX_H = 72;
const X_LEFT = 40;
const Y_CENTER_X = W - Y_BOX_W - 40;
const X1_Y = 80;
const X2_Y = H - 80 - BOX_H;
const Y_BOX_Y = (H - Y_BOX_H) / 2;

function truncate(text: string, max = 24): string {
  return text.length > max ? text.slice(0, max - 1) + "…" : text;
}

export function KerangkaSVG({ x1, x2, y }: KerangkaSVGProps) {
  const x1cx = X_LEFT + BOX_W / 2;
  const x1cy = X1_Y + BOX_H / 2;
  const x2cx = X_LEFT + BOX_W / 2;
  const x2cy = X2_Y + BOX_H / 2;
  const ycx = Y_CENTER_X + Y_BOX_W / 2;
  const ycy = Y_BOX_Y + Y_BOX_H / 2;

  // Arrow endpoints: from right edge of X box to left edge of Y box
  const arrowStartX = X_LEFT + BOX_W + 4;
  const arrowEndX = Y_CENTER_X - 4;

  // Simultaneous arrow: from midpoint between X1 and X2
  const simStartX = X_LEFT + BOX_W / 2;
  const simStartY = (x1cy + x2cy) / 2;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height="100%"
      style={{ maxHeight: 440 }}
      xmlns="http://www.w3.org/2000/svg"
      fontFamily="Inter, system-ui, sans-serif"
    >
      <defs>
        <marker id="arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#3B82F6" />
        </marker>
        <marker id="arrow-sim" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#6366F1" />
        </marker>
        <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#00000018" />
        </filter>
      </defs>

      {/* Background */}
      <rect width={W} height={H} fill="#F8FAFC" rx="12" />

      {/* ── X1 Box ── */}
      <rect x={X_LEFT} y={X1_Y} width={BOX_W} height={BOX_H} rx="10" fill="#EFF6FF" stroke="#3B82F6" strokeWidth="2" filter="url(#shadow)" />
      <text x={x1cx} y={X1_Y + 22} textAnchor="middle" fontSize="11" fontWeight="700" fill="#1D4ED8">
        {truncate(x1, 22)} (X1)
      </text>
      <text x={x1cx} y={X1_Y + 40} textAnchor="middle" fontSize="10" fill="#3B82F6">Variabel Independen</text>
      <text x={x1cx} y={X1_Y + 54} textAnchor="middle" fontSize="9" fill="#93C5FD">H1 →</text>

      {/* ── X2 Box ── */}
      <rect x={X_LEFT} y={X2_Y} width={BOX_W} height={BOX_H} rx="10" fill="#F5F3FF" stroke="#6366F1" strokeWidth="2" filter="url(#shadow)" />
      <text x={x2cx} y={X2_Y + 22} textAnchor="middle" fontSize="11" fontWeight="700" fill="#4338CA">
        {truncate(x2, 22)} (X2)
      </text>
      <text x={x2cx} y={X2_Y + 40} textAnchor="middle" fontSize="10" fill="#6366F1">Variabel Independen</text>
      <text x={x2cx} y={X2_Y + 54} textAnchor="middle" fontSize="9" fill="#A5B4FC">H2 →</text>

      {/* ── Y Box ── */}
      <rect x={Y_CENTER_X} y={Y_BOX_Y} width={Y_BOX_W} height={Y_BOX_H} rx="10" fill="#ECFDF5" stroke="#10B981" strokeWidth="2.5" filter="url(#shadow)" />
      <text x={ycx} y={Y_BOX_Y + 24} textAnchor="middle" fontSize="11" fontWeight="700" fill="#047857">
        {truncate(y, 24)} (Y)
      </text>
      <text x={ycx} y={Y_BOX_Y + 42} textAnchor="middle" fontSize="10" fill="#10B981">Variabel Dependen</text>
      <text x={ycx} y={Y_BOX_Y + 58} textAnchor="middle" fontSize="9" fill="#6EE7B7">← H1, H2, H3</text>

      {/* ── H1 Arrow: X1 → Y ── */}
      <line
        x1={arrowStartX} y1={x1cy}
        x2={arrowEndX} y2={ycy - 12}
        stroke="#3B82F6" strokeWidth="2" strokeDasharray="5,3"
        markerEnd="url(#arrow)"
      />
      <text
        x={(arrowStartX + arrowEndX) / 2}
        y={((x1cy + ycy - 12) / 2) - 8}
        textAnchor="middle" fontSize="11" fontWeight="600" fill="#2563EB"
      >
        H1
      </text>

      {/* ── H2 Arrow: X2 → Y ── */}
      <line
        x1={arrowStartX} y1={x2cy}
        x2={arrowEndX} y2={ycy + 12}
        stroke="#6366F1" strokeWidth="2" strokeDasharray="5,3"
        markerEnd="url(#arrow-sim)"
      />
      <text
        x={(arrowStartX + arrowEndX) / 2}
        y={((x2cy + ycy + 12) / 2) + 16}
        textAnchor="middle" fontSize="11" fontWeight="600" fill="#4338CA"
      >
        H2
      </text>

      {/* ── H3 Arrow: X1+X2 simultan → Y (curved bracket line) ── */}
      {/* Bracket line connecting X1 and X2 left side */}
      <line
        x1={X_LEFT - 20} y1={x1cy}
        x2={X_LEFT - 20} y2={x2cy}
        stroke="#8B5CF6" strokeWidth="1.5"
      />
      <line x1={X_LEFT - 20} y1={x1cy} x2={X_LEFT} y2={x1cy} stroke="#8B5CF6" strokeWidth="1.5" />
      <line x1={X_LEFT - 20} y1={x2cy} x2={X_LEFT} y2={x2cy} stroke="#8B5CF6" strokeWidth="1.5" />
      {/* H3 from bracket midpoint to Y */}
      <line
        x1={X_LEFT - 20} y1={simStartY}
        x2={X_LEFT - 50} y2={simStartY}
        stroke="#8B5CF6" strokeWidth="1.5"
      />
      <path
        d={`M ${X_LEFT - 50} ${simStartY} Q ${X_LEFT - 50} ${ycy} ${arrowEndX} ${ycy}`}
        fill="none" stroke="#8B5CF6" strokeWidth="1.8" strokeDasharray="6,3"
        markerEnd="url(#arrow-sim)"
      />
      <text
        x={X_LEFT - 44}
        y={simStartY - 8}
        textAnchor="middle" fontSize="11" fontWeight="700" fill="#7C3AED"
      >
        H3
      </text>
      <text
        x={X_LEFT - 44}
        y={simStartY + 5}
        textAnchor="middle" fontSize="8" fill="#A78BFA"
      >
        (simultan)
      </text>
    </svg>
  );
}

// ─── PNG Export ────────────────────────────────────────────────────────────────

async function exportSVGtoPNG(svgEl: SVGSVGElement, filename: string, scale = 2): Promise<void> {
  const svgString = new XMLSerializer().serializeToString(svgEl);
  const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const bbox = svgEl.getBoundingClientRect();
      canvas.width = W * scale;
      canvas.height = H * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas context unavailable")); return; }
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0, W, H);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => {
        if (!blob) { reject(new Error("Blob creation failed")); return; }
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        a.click();
        URL.revokeObjectURL(a.href);
        resolve();
      }, "image/png");
    };
    img.onerror = reject;
    img.src = url;
  });
}

// ─── Hipotesis cards ───────────────────────────────────────────────────────────

function HipotesisCard({ code, text, color }: { code: string; text: string; color: string }) {
  return (
    <div className={`rounded-xl border-2 px-4 py-3 ${color}`}>
      <div className="flex items-center gap-2 mb-1">
        <Badge className="font-bold text-xs">{code}</Badge>
      </div>
      <p className="text-sm text-slate-700 leading-relaxed">{text}</p>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function KerangkaPage() {
  const [thesis, setThesis] = useState<ThesisState>({ x1: "", x2: "", y: "", objek: "" });
  const [exporting, setExporting] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    setThesis(loadThesisState());
  }, []);

  const isReady = !!thesis.x1 && !!thesis.x2 && !!thesis.y;

  async function handleExport() {
    if (!svgRef.current) return;
    setExporting(true);
    try {
      await exportSVGtoPNG(svgRef.current, "kerangka-berpikir.png", 3);
      toast.success("PNG kerangka berpikir berhasil dibuat");
    } catch (e) {
      console.error(e);
      toast.error("Gagal membuat PNG");
    }
    setExporting(false);
  }

  const hipotesis = isReady
    ? [
        {
          code: "H1",
          text: `${thesis.x1} berpengaruh positif dan signifikan terhadap ${thesis.y}.`,
          color: "border-blue-300 bg-blue-50",
        },
        {
          code: "H2",
          text: `${thesis.x2} berpengaruh positif dan signifikan terhadap ${thesis.y}.`,
          color: "border-indigo-300 bg-indigo-50",
        },
        {
          code: "H3",
          text: `${thesis.x1} dan ${thesis.x2} secara simultan berpengaruh positif dan signifikan terhadap ${thesis.y}.`,
          color: "border-violet-300 bg-violet-50",
        },
      ]
    : [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Kerangka Berpikir</h1>
          <p className="text-slate-500 text-sm mt-1">
            Diagram alur hubungan variabel penelitian yang dapat diekspor sebagai gambar PNG.
          </p>
        </div>
        {isReady && (
          <button
            onClick={handleExport}
            disabled={exporting}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors"
          >
            {exporting ? (
              <><RefreshCw className="w-4 h-4 animate-spin" /> Mengekspor...</>
            ) : (
              <><Download className="w-4 h-4" /> Export PNG</>
            )}
          </button>
        )}
      </div>

      {/* Variabel badges */}
      {isReady && (
        <div className="flex flex-wrap gap-2">
          <Badge className="bg-blue-100 text-blue-700 border-blue-200">X1: {thesis.x1}</Badge>
          <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200">X2: {thesis.x2}</Badge>
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Y: {thesis.y}</Badge>
        </div>
      )}

      {!isReady && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Variabel belum dipilih.{" "}
            <a href="/judul" className="text-blue-600 underline font-medium">Buka Generator Judul</a>{" "}
            untuk memilih X1, X2, dan Y terlebih dahulu.
          </AlertDescription>
        </Alert>
      )}

      {/* SVG Diagram */}
      {isReady && (
        <Card>
          <CardHeader className="pb-3 bg-slate-50 border-b border-slate-200">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>Diagram Kerangka Berpikir</span>
              <span className="text-xs text-slate-400 font-normal">SVG · Resolusi Tinggi</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 px-4 pb-6 bg-white">
            <div className="w-full rounded-xl overflow-hidden border border-slate-100">
              <KerangkaSVGWithRef svgRef={svgRef as React.RefObject<SVGSVGElement>} x1={thesis.x1} x2={thesis.x2} y={thesis.y} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hipotesis */}
      {isReady && (
        <Card>
          <CardHeader className="pb-3 bg-slate-50 border-b border-slate-200">
            <CardTitle className="text-base">Hipotesis Penelitian</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {hipotesis.map((h) => (
              <HipotesisCard key={h.code} {...h} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      {isReady && (
        <Card className="bg-slate-50">
          <CardContent className="pt-4">
            <p className="text-xs font-semibold text-slate-600 mb-3">Keterangan Diagram:</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { color: "border-blue-400 bg-blue-50", label: "Warna Biru", desc: `${thesis.x1} (X1) — Variabel Independen 1` },
                { color: "border-indigo-400 bg-indigo-50", label: "Warna Ungu", desc: `${thesis.x2} (X2) — Variabel Independen 2` },
                { color: "border-emerald-400 bg-emerald-50", label: "Warna Hijau", desc: `${thesis.y} (Y) — Variabel Dependen` },
              ].map(({ color, label, desc }) => (
                <div key={label} className={`border-l-4 ${color} rounded-r px-3 py-2`}>
                  <p className="text-xs font-semibold text-slate-700">{label}</p>
                  <p className="text-xs text-slate-500">{desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <svg width="32" height="8"><line x1="0" y1="4" x2="32" y2="4" stroke="#3B82F6" strokeWidth="2" strokeDasharray="5,3" markerEnd="url(#arrow)" /></svg>
                Garis putus-putus = pengaruh parsial (H1, H2)
              </span>
              <span className="flex items-center gap-1.5">
                <svg width="32" height="8"><line x1="0" y1="4" x2="32" y2="4" stroke="#8B5CF6" strokeWidth="2" strokeDasharray="6,3" /></svg>
                Garis lengkung = pengaruh simultan (H3)
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Wrapper that forwards ref to the SVG inside KerangkaSVG
function KerangkaSVGWithRef({
  svgRef,
  x1, x2, y,
}: {
  svgRef: React.RefObject<SVGSVGElement>;
  x1: string;
  x2: string;
  y: string;
}) {
  const x1cx = X_LEFT + BOX_W / 2;
  const x1cy = X1_Y + BOX_H / 2;
  const x2cx = X_LEFT + BOX_W / 2;
  const x2cy = X2_Y + BOX_H / 2;
  const ycx = Y_CENTER_X + Y_BOX_W / 2;
  const ycy = Y_BOX_Y + Y_BOX_H / 2;

  const arrowStartX = X_LEFT + BOX_W + 4;
  const arrowEndX = Y_CENTER_X - 4;
  const simStartY = (x1cy + x2cy) / 2;

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height="100%"
      style={{ maxHeight: 440, display: "block" }}
      xmlns="http://www.w3.org/2000/svg"
      fontFamily="Inter, system-ui, sans-serif"
    >
      <defs>
        <marker id="arr1" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#3B82F6" />
        </marker>
        <marker id="arr2" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#6366F1" />
        </marker>
        <marker id="arr3" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#8B5CF6" />
        </marker>
        <filter id="dropshadow">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#00000018" />
        </filter>
      </defs>

      <rect width={W} height={H} fill="#F8FAFC" rx="12" />

      {/* X1 */}
      <rect x={X_LEFT} y={X1_Y} width={BOX_W} height={BOX_H} rx="10" fill="#EFF6FF" stroke="#3B82F6" strokeWidth="2" filter="url(#dropshadow)" />
      <text x={x1cx} y={X1_Y + 22} textAnchor="middle" fontSize="11" fontWeight="700" fill="#1D4ED8">{truncate(x1, 22)} (X1)</text>
      <text x={x1cx} y={X1_Y + 40} textAnchor="middle" fontSize="10" fill="#3B82F6">Variabel Independen</text>
      <text x={x1cx} y={X1_Y + 54} textAnchor="middle" fontSize="9" fill="#93C5FD">H1 →</text>

      {/* X2 */}
      <rect x={X_LEFT} y={X2_Y} width={BOX_W} height={BOX_H} rx="10" fill="#F5F3FF" stroke="#6366F1" strokeWidth="2" filter="url(#dropshadow)" />
      <text x={x2cx} y={X2_Y + 22} textAnchor="middle" fontSize="11" fontWeight="700" fill="#4338CA">{truncate(x2, 22)} (X2)</text>
      <text x={x2cx} y={X2_Y + 40} textAnchor="middle" fontSize="10" fill="#6366F1">Variabel Independen</text>
      <text x={x2cx} y={X2_Y + 54} textAnchor="middle" fontSize="9" fill="#A5B4FC">H2 →</text>

      {/* Y */}
      <rect x={Y_CENTER_X} y={Y_BOX_Y} width={Y_BOX_W} height={Y_BOX_H} rx="10" fill="#ECFDF5" stroke="#10B981" strokeWidth="2.5" filter="url(#dropshadow)" />
      <text x={ycx} y={Y_BOX_Y + 24} textAnchor="middle" fontSize="11" fontWeight="700" fill="#047857">{truncate(y, 24)} (Y)</text>
      <text x={ycx} y={Y_BOX_Y + 42} textAnchor="middle" fontSize="10" fill="#10B981">Variabel Dependen</text>
      <text x={ycx} y={Y_BOX_Y + 58} textAnchor="middle" fontSize="9" fill="#6EE7B7">← H1, H2, H3</text>

      {/* H1 arrow */}
      <line x1={arrowStartX} y1={x1cy} x2={arrowEndX} y2={ycy - 12} stroke="#3B82F6" strokeWidth="2" strokeDasharray="5,3" markerEnd="url(#arr1)" />
      <text x={(arrowStartX + arrowEndX) / 2} y={((x1cy + ycy - 12) / 2) - 8} textAnchor="middle" fontSize="11" fontWeight="600" fill="#2563EB">H1</text>

      {/* H2 arrow */}
      <line x1={arrowStartX} y1={x2cy} x2={arrowEndX} y2={ycy + 12} stroke="#6366F1" strokeWidth="2" strokeDasharray="5,3" markerEnd="url(#arr2)" />
      <text x={(arrowStartX + arrowEndX) / 2} y={((x2cy + ycy + 12) / 2) + 16} textAnchor="middle" fontSize="11" fontWeight="600" fill="#4338CA">H2</text>

      {/* H3 bracket and arrow */}
      <line x1={X_LEFT - 20} y1={x1cy} x2={X_LEFT - 20} y2={x2cy} stroke="#8B5CF6" strokeWidth="1.5" />
      <line x1={X_LEFT - 20} y1={x1cy} x2={X_LEFT} y2={x1cy} stroke="#8B5CF6" strokeWidth="1.5" />
      <line x1={X_LEFT - 20} y1={x2cy} x2={X_LEFT} y2={x2cy} stroke="#8B5CF6" strokeWidth="1.5" />
      <line x1={X_LEFT - 20} y1={simStartY} x2={X_LEFT - 50} y2={simStartY} stroke="#8B5CF6" strokeWidth="1.5" />
      <path d={`M ${X_LEFT - 50} ${simStartY} Q ${X_LEFT - 50} ${ycy} ${arrowEndX} ${ycy}`} fill="none" stroke="#8B5CF6" strokeWidth="1.8" strokeDasharray="6,3" markerEnd="url(#arr3)" />
      <text x={X_LEFT - 44} y={simStartY - 8} textAnchor="middle" fontSize="11" fontWeight="700" fill="#7C3AED">H3</text>
      <text x={X_LEFT - 44} y={simStartY + 5} textAnchor="middle" fontSize="8" fill="#A78BFA">(simultan)</text>
    </svg>
  );
}
