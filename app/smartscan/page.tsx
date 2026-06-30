"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { closestCenter, DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { PDFDocument } from "pdf-lib";
import { ArrowRight, Download, GripVertical, ImagePlus, Loader2, RotateCw, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

const MAX_IMAGES = 30;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const SUPPORTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const SMARTSCAN_STORAGE_KEY = "smartcampus.smartscan.latestPdf";

type ScanPage = {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string;
  rotation: number;
};

type StoredSmartScanPdf = {
  fileName: string;
  mimeType: string;
  base64: string;
  createdAt: string;
  pageCount: number;
};

export default function SmartScanPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [pages, setPages] = useState<ScanPage[]>([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const counterText = `${pages.length}/${MAX_IMAGES} gambar`;
  const canExport = pages.length > 0 && !isGenerating;

  const addFiles = useCallback(async (files: FileList | File[]) => {
    const incoming = Array.from(files);
    if (pages.length + incoming.length > MAX_IMAGES) {
      toast.error("Maksimal 30 gambar per dokumen.");
      return;
    }

    const accepted: ScanPage[] = [];
    for (const file of incoming) {
      const validation = validateImageFile(file);
      if (!validation.ok) {
        toast.error(validation.message);
        continue;
      }
      try {
        accepted.push({
          id: `${Date.now()}-${crypto.randomUUID()}`,
          name: file.name || "clipboard-image.png",
          type: file.type,
          size: file.size,
          dataUrl: await readFileAsDataUrl(file),
          rotation: 0,
        });
      } catch {
        toast.error(`${file.name || "Gambar"} tidak bisa dibaca.`);
      }
    }

    if (accepted.length > 0) setPages((current) => [...current, ...accepted].slice(0, MAX_IMAGES));
  }, [pages.length]);

  useEffect(() => {
    function onPaste(event: ClipboardEvent) {
      const items = Array.from(event.clipboardData?.items || []);
      const imageFiles = items
        .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
        .map((item) => item.getAsFile())
        .filter((file): file is File => Boolean(file));
      if (imageFiles.length === 0) return;
      event.preventDefault();
      void addFiles(imageFiles).then(() => {
        toast.success("Gambar berhasil ditambahkan dari clipboard.");
      });
    }

    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [addFiles]);

  function removePage(id: string) {
    setPages((current) => current.filter((page) => page.id !== id));
  }

  function rotatePage(id: string) {
    setPages((current) => current.map((page) => page.id === id ? { ...page, rotation: (page.rotation + 90) % 360 } : page));
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setPages((current) => {
      const oldIndex = current.findIndex((page) => page.id === active.id);
      const newIndex = current.findIndex((page) => page.id === over.id);
      return oldIndex >= 0 && newIndex >= 0 ? arrayMove(current, oldIndex, newIndex) : current;
    });
  }

  async function buildPdf(): Promise<{ bytes: Uint8Array; fileName: string }> {
    const pdf = await PDFDocument.create();
    for (const page of pages) {
      try {
        const pngBytes = await renderPageToPng(page);
        const image = await pdf.embedPng(pngBytes);
        const pdfPage = pdf.addPage([595.28, 841.89]);
        pdfPage.drawRectangle({ x: 0, y: 0, width: 595.28, height: 841.89, color: undefined });
        pdfPage.drawImage(image, { x: 0, y: 0, width: 595.28, height: 841.89 });
      } catch {
        toast.error(`${page.name} dilewati karena gambar rusak atau tidak bisa diproses.`);
      }
    }
    const bytes = await pdf.save();
    return { bytes, fileName: `smartscan-${new Date().toISOString().slice(0, 10)}.pdf` };
  }

  async function downloadPdf() {
    if (!canExport) return;
    setIsGenerating(true);
    try {
      const { bytes, fileName } = await buildPdf();
      if (bytes.length === 0) throw new Error("PDF kosong.");
      downloadBytes(bytes, fileName);
      toast.success("PDF berhasil dibuat.");
    } catch {
      toast.error("Gagal membuat PDF.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function useForAssignment() {
    if (!canExport) return;
    setIsGenerating(true);
    try {
      const { bytes, fileName } = await buildPdf();
      const base64 = uint8ToBase64(bytes);
      const payload: StoredSmartScanPdf = {
        fileName,
        mimeType: "application/pdf",
        base64,
        createdAt: new Date().toISOString(),
        pageCount: pages.length,
      };
      window.sessionStorage.setItem(SMARTSCAN_STORAGE_KEY, JSON.stringify(payload));
      toast.success("PDF SmartScan siap digunakan di Assignment Workspace.");
      router.push("/assignment");
    } catch {
      toast.error("Gagal menyiapkan PDF untuk Assignment Workspace.");
    } finally {
      setIsGenerating(false);
    }
  }

  const pageIds = useMemo(() => pages.map((page) => page.id), [pages]);

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <header className="border-b border-slate-200 pb-5">
        <p className="text-xs font-bold uppercase tracking-wide text-blue-700">SmartCampus</p>
        <h1 className="mt-1 text-2xl font-extrabold text-slate-950">SmartScan Image to PDF V1</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-500">
          Gabungkan foto tugas, screenshot, atau gambar dari clipboard menjadi satu PDF A4 tanpa aplikasi scanner tambahan.
        </p>
      </header>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Tambah Gambar</h2>
            <p className="mt-1 text-xs text-slate-500">{counterText}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <Upload className="h-4 w-4" />
              Pilih Gambar
            </button>
            <button
              type="button"
              onClick={downloadPdf}
              disabled={!canExport}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Download PDF
            </button>
            <button
              type="button"
              onClick={useForAssignment}
              disabled={!canExport}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ArrowRight className="h-4 w-4" />
              Gunakan untuk Analisis Tugas
            </button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
          className="hidden"
          onChange={(event) => {
            if (event.target.files) void addFiles(event.target.files);
            event.currentTarget.value = "";
          }}
        />

        <div
          onDragOver={(event) => {
            event.preventDefault();
            setIsDraggingOver(true);
          }}
          onDragLeave={() => setIsDraggingOver(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDraggingOver(false);
            void addFiles(event.dataTransfer.files);
          }}
          className={`mt-4 rounded-lg border border-dashed px-4 py-8 text-center transition ${isDraggingOver ? "border-blue-400 bg-blue-50" : "border-slate-300 bg-slate-50"}`}
        >
          <ImagePlus className="mx-auto h-10 w-10 text-slate-400" />
          <p className="mt-3 text-sm font-semibold text-slate-800">Upload foto tugas, screenshot, atau paste gambar dengan Ctrl+V.</p>
          <p className="mt-1 text-xs text-slate-500">JPG, PNG, WEBP. Maksimal 10MB per gambar dan 30 gambar per dokumen.</p>
        </div>
      </section>

      {pages.length === 0 ? (
        <section className="flex min-h-[260px] items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <div>
            <ImagePlus className="mx-auto h-10 w-10 text-slate-400" />
            <h2 className="mt-3 text-base font-bold text-slate-900">Belum ada gambar</h2>
            <p className="mt-1 max-w-md text-sm text-slate-500">Upload foto tugas, screenshot, atau paste gambar dengan Ctrl+V.</p>
          </div>
        </section>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={pageIds} strategy={verticalListSortingStrategy}>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {pages.map((page, index) => (
                <SortableScanCard
                  key={page.id}
                  page={page}
                  index={index}
                  onDelete={() => removePage(page.id)}
                  onRotate={() => rotatePage(page.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

function SortableScanCard({ page, index, onDelete, onRotate }: { page: ScanPage; index: number; onDelete: () => void; onRotate: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: page.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border border-slate-200 bg-white p-3 shadow-sm ${isDragging ? "opacity-70 ring-2 ring-blue-200" : ""}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-blue-700">Halaman {index + 1}</p>
          <p className="mt-0.5 max-w-[180px] truncate text-sm font-semibold text-slate-900">{page.name}</p>
        </div>
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="inline-flex h-8 w-8 cursor-grab items-center justify-center rounded-lg border border-slate-200 text-slate-500 active:cursor-grabbing"
          aria-label="Ubah urutan halaman"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 flex aspect-[3/4] items-center justify-center overflow-hidden rounded-lg bg-slate-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={page.dataUrl}
          alt={`Halaman ${index + 1}`}
          className="max-h-full max-w-full object-contain transition"
          style={{ transform: `rotate(${page.rotation}deg)` }}
        />
      </div>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={onRotate} className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          <RotateCw className="h-4 w-4" />
          Rotate
        </button>
        <button type="button" onClick={onDelete} className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg border border-rose-200 text-sm font-semibold text-rose-700 hover:bg-rose-50">
          <Trash2 className="h-4 w-4" />
          Hapus
        </button>
      </div>
    </article>
  );
}

function validateImageFile(file: File): { ok: true } | { ok: false; message: string } {
  if (!SUPPORTED_TYPES.includes(file.type)) return { ok: false, message: `${file.name || "File"} bukan JPG, PNG, atau WEBP.` };
  if (file.size > MAX_FILE_SIZE) return { ok: false, message: `${file.name || "Gambar"} lebih dari 10MB dan ditolak.` };
  return { ok: true };
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("Gagal membaca file."));
    reader.readAsDataURL(file);
  });
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Gambar rusak."));
    image.src = dataUrl;
  });
}

async function renderPageToPng(page: ScanPage): Promise<Uint8Array> {
  const image = await loadImage(page.dataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = 1240;
  canvas.height = 1754;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas tidak tersedia.");

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);

  const margin = 70;
  const availableWidth = canvas.width - margin * 2;
  const availableHeight = canvas.height - margin * 2;
  const rotated = page.rotation % 180 !== 0;
  const sourceWidth = rotated ? image.naturalHeight : image.naturalWidth;
  const sourceHeight = rotated ? image.naturalWidth : image.naturalHeight;
  const scale = Math.min(availableWidth / sourceWidth, availableHeight / sourceHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;

  context.save();
  context.translate(canvas.width / 2, canvas.height / 2);
  context.rotate((page.rotation * Math.PI) / 180);
  context.drawImage(image, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
  context.restore();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((value) => value ? resolve(value) : reject(new Error("Gagal render gambar.")), "image/png", 0.95);
  });
  return new Uint8Array(await blob.arrayBuffer());
}

function downloadBytes(bytes: Uint8Array, fileName: string) {
  const blob = new Blob([toArrayBuffer(bytes)], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.slice(index, index + chunkSize));
  }
  return window.btoa(binary);
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}
