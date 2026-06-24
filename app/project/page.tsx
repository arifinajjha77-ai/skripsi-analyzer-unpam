"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  FolderOpen, Plus, Trash2, LogIn, Calendar, Clock,
  BarChart2, CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  loadProjects, saveProjects, createProject, switchToProject,
  deleteProject, estimateProgress, getStageLabel,
  getActiveProjectId, snapshotCurrentState,
  type Project,
} from "@/lib/projectStore";

function ProgressBar({ value }: { value: number }) {
  const color =
    value === 100 ? "bg-emerald-500" :
    value >= 60   ? "bg-blue-500"    :
    value >= 30   ? "bg-amber-500"   : "bg-slate-300";
  return (
    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${value}%` }} />
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export default function ProjectPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeId, setActiveId]  = useState<string | null>(null);
  const [showForm, setShowForm]  = useState(false);
  const [newName, setNewName]    = useState("");
  const [newDesc, setNewDesc]    = useState("");
  const [delConfirm, setDelConfirm] = useState<string | null>(null);

  useEffect(() => {
    setProjects(loadProjects());
    setActiveId(getActiveProjectId());
  }, []);

  const handleCreate = useCallback(() => {
    if (!newName.trim()) { toast.error("Nama project tidak boleh kosong"); return; }
    const proj = createProject(newName, newDesc);
    const updated = [...projects, proj];
    saveProjects(updated);
    setProjects(updated);
    setNewName("");
    setNewDesc("");
    setShowForm(false);
    toast.success(`Project "${proj.name}" berhasil dibuat`);
  }, [newName, newDesc, projects]);

  const handleSwitch = useCallback((proj: Project) => {
    // save current state to previously active project
    if (activeId) {
      const prev = projects.find((p) => p.id === activeId);
      if (prev) {
        const snap = snapshotCurrentState();
        const updated = projects.map((p) =>
          p.id === activeId ? { ...p, snapshot: snap, lastModified: new Date().toISOString() } : p
        );
        saveProjects(updated);
      }
    }
    switchToProject(proj);
    setActiveId(proj.id);
    toast.success(`Berpindah ke project "${proj.name}"`);
    setTimeout(() => router.push("/"), 500);
  }, [activeId, projects, router]);

  const handleDelete = useCallback((id: string) => {
    deleteProject(id);
    const updated = projects.filter((p) => p.id !== id);
    setProjects(updated);
    if (activeId === id) setActiveId(null);
    setDelConfirm(null);
    toast.success("Project dihapus");
  }, [projects, activeId]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <FolderOpen className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Manajemen Project</h1>
            <p className="text-sm text-slate-500">{projects.length} project tersimpan · localStorage</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          Project Baru
        </button>
      </div>

      {/* New project form */}
      {showForm && (
        <div className="bg-white rounded-2xl border-2 border-blue-200 p-5 shadow-sm">
          <h2 className="text-sm font-bold text-slate-700 mb-3">Project Baru</h2>
          <div className="space-y-3">
            <input
              autoFocus
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="Nama project, contoh: Skripsi Andi - Keputusan Pembelian"
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Deskripsi singkat (opsional)"
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-2">
              <button onClick={handleCreate} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg font-medium transition-colors">
                Buat Project
              </button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 text-sm rounded-lg transition-colors">
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {projects.length === 0 && !showForm && (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
          <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="font-semibold text-slate-600">Belum ada project</p>
          <p className="text-sm text-slate-400 mt-1">Klik "Project Baru" untuk memulai</p>
        </div>
      )}

      {/* Project list */}
      <div className="space-y-3">
        {projects.map((proj) => {
          const progress = estimateProgress(proj.snapshot);
          const stage    = getStageLabel(progress);
          const isActive = proj.id === activeId;
          return (
            <div
              key={proj.id}
              className={`bg-white rounded-2xl border p-4 shadow-sm transition-all ${
                isActive ? "border-blue-300 ring-2 ring-blue-100" : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-slate-800 truncate">{proj.name}</h3>
                    {isActive && (
                      <span className="inline-flex items-center gap-1 text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                        <CheckCircle className="w-3 h-3" /> Aktif
                      </span>
                    )}
                    <span className={`inline-flex text-[10px] px-2 py-0.5 rounded-full font-semibold
                      ${progress >= 85 ? "bg-emerald-100 text-emerald-700"
                      : progress >= 50 ? "bg-blue-100 text-blue-700"
                      : progress >= 20 ? "bg-amber-100 text-amber-700"
                      : "bg-slate-100 text-slate-600"}`}>
                      {stage}
                    </span>
                  </div>
                  {proj.description && (
                    <p className="text-xs text-slate-500 mt-0.5">{proj.description}</p>
                  )}
                  <div className="mt-2 space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <BarChart2 className="w-3 h-3" /> {progress}% selesai
                      </span>
                      <span>{progress}%</span>
                    </div>
                    <ProgressBar value={progress} />
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {formatDate(proj.createdAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Diubah {formatDate(proj.lastModified)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {!isActive && (
                    <button
                      onClick={() => handleSwitch(proj)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      Buka
                    </button>
                  )}
                  {delConfirm === proj.id ? (
                    <div className="flex gap-1">
                      <button onClick={() => handleDelete(proj.id)} className="px-2.5 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs rounded-lg transition-colors">
                        Ya, hapus
                      </button>
                      <button onClick={() => setDelConfirm(null)} className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs rounded-lg transition-colors">
                        Batal
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDelConfirm(proj.id)}
                      className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 text-xs text-slate-500 space-y-1">
        <p className="font-semibold text-slate-600">Cara kerja project:</p>
        <p>• Setiap project menyimpan snapshot data (judul, BAB I, responden, analisis) di localStorage browser.</p>
        <p>• Klik "Buka" untuk berpindah ke project lain — semua data akan berganti otomatis.</p>
        <p>• Data tersimpan permanen di browser selama tidak dihapus cache/localStorage.</p>
      </div>
    </div>
  );
}
