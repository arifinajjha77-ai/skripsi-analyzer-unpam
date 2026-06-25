"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Upload, Settings2, BarChart2, CheckCircle, ShieldCheck, TrendingUp,
  FileText, LayoutDashboard, X, BookOpen, ClipboardList, Newspaper,
  GitFork, Table2, Users, Settings, FolderOpen, Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppContext } from "@/lib/context";

// ─── route map ────────────────────────────────────────────────────────────────

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  group: string;
  alwaysEnabled?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/",        label: "Dashboard",           icon: LayoutDashboard, group: "root",      alwaysEnabled: true },
  { href: "/project", label: "Project",              icon: FolderOpen,      group: "root",      alwaysEnabled: true },

  // Generator
  { href: "/judul",           label: "Generator Judul",      icon: BookOpen,      group: "Generator", alwaysEnabled: true },
  { href: "/kuesioner",       label: "Kuesioner",            icon: ClipboardList, group: "Generator", alwaysEnabled: true },
  { href: "/latar-belakang",  label: "Latar Belakang",       icon: Newspaper,     group: "Generator", alwaysEnabled: true },
  { href: "/kerangka",        label: "Kerangka Berpikir",    icon: GitFork,       group: "Generator", alwaysEnabled: true },
  { href: "/operasional",     label: "Operasional Variabel", icon: Table2,        group: "Generator", alwaysEnabled: true },

  // Penelitian
  { href: "/responden", label: "Responden Center",  icon: Users,    group: "Penelitian", alwaysEnabled: true },
  { href: "/upload",    label: "Upload Data",        icon: Upload,   group: "Penelitian", alwaysEnabled: true },
  { href: "/mapping",   label: "Mapping Variabel",   icon: Settings2,group: "Penelitian" },

  // Analisis
  { href: "/deskriptif",   label: "Deskriptif",   icon: BarChart2,  group: "Analisis" },
  { href: "/validitas",    label: "Validitas",    icon: CheckCircle, group: "Analisis" },
  { href: "/reliabilitas", label: "Reliabilitas", icon: ShieldCheck, group: "Analisis" },
  { href: "/regresi",      label: "Regresi",      icon: TrendingUp,  group: "Analisis" },
  { href: "/narasi",       label: "Narasi Bab 4", icon: FileText,    group: "Analisis" },
];

const GROUP_ORDER = ["root", "Generator", "Penelitian", "Analisis"];
const GROUP_LABELS: Record<string, string> = {
  Generator: "Generator",
  Penelitian: "Penelitian",
  Analisis: "Analisis",
};

// ─── component ────────────────────────────────────────────────────────────────

interface SidebarProps { open: boolean; onClose: () => void; }

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { state } = useAppContext();
  const hasData    = state.rawData.length > 0;
  const hasMapping = state.variables.length > 0;

  function isDisabled(item: NavItem): boolean {
    if (item.alwaysEnabled) return false;
    if (item.href === "/upload") return false;
    if (item.href === "/mapping") return !hasData;
    return !hasData || !hasMapping;
  }

  const grouped = GROUP_ORDER.map((g) => ({
    group: g,
    items: NAV_ITEMS.filter((n) => n.group === g),
  }));

  function NavLink({ item }: { item: NavItem }) {
    const disabled = isDisabled(item);
    const active   = pathname === item.href;
    const Icon     = item.icon;
    return (
      <Link
        href={disabled ? "#" : item.href}
        onClick={(e) => { if (disabled) e.preventDefault(); else onClose(); }}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
          active   ? "bg-blue-50 text-blue-700"
          : disabled ? "text-slate-300 cursor-not-allowed"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        )}
      >
        <Icon className={cn("w-4 h-4 shrink-0",
          active ? "text-blue-600" : disabled ? "text-slate-300" : "text-slate-400"
        )} />
        <span className="truncate">{item.label}</span>
      </Link>
    );
  }

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={onClose} />
      )}

      <aside className={cn(
        "fixed top-0 left-0 z-30 h-full w-60 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200",
        "lg:translate-x-0 lg:static lg:z-auto",
        open ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold">SA</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-800 leading-tight">Skripsi Analyzer</p>
              <p className="text-[10px] text-slate-400 leading-tight">FEB UNPAM</p>
            </div>
          </div>
          <button className="lg:hidden text-slate-400 hover:text-slate-600 p-1" onClick={onClose}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Data badge */}
        {state.fileName && (
          <div className="mx-3 mt-2.5 px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg">
            <p className="text-[10px] text-emerald-700 font-semibold truncate">✓ {state.fileName}</p>
            <p className="text-[10px] text-emerald-600">{state.rawData.length} responden</p>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-4">
          {grouped.map(({ group, items }) => (
            <div key={group}>
              {GROUP_LABELS[group] && (
                <p className="px-3 mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {GROUP_LABELS[group]}
                </p>
              )}
              <div className="space-y-0.5">
                {items.map((item) => <NavLink key={item.href} item={item} />)}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-2 py-3 border-t border-slate-200 space-y-0.5">
          <Link
            href="/settings"
            onClick={onClose}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              pathname === "/settings" ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            )}
          >
            <Settings className="w-4 h-4 text-slate-400 shrink-0" />
            Pengaturan
          </Link>
          <Link
            href="/settings/template"
            onClick={onClose}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              pathname === "/settings/template" ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            )}
          >
            <Layers className="w-4 h-4 text-slate-400 shrink-0" />
            Template Kampus
          </Link>
          <div className="px-3 py-2">
            <p className="text-[10px] text-amber-600 bg-amber-50 rounded px-2 py-1.5 leading-relaxed border border-amber-100">
              ⚠️ Pastikan data berasal dari responden asli.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
