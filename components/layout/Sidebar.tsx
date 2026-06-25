"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Upload, Settings2, BarChart2, CheckCircle, ShieldCheck, TrendingUp,
  FileText, LayoutDashboard, X, BookOpen, ClipboardList, Newspaper,
  GitFork, Table2, Users, Settings, FolderOpen, Layers, BookMarked,
  GraduationCap, BookCopy, ChevronDown, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppContext } from "@/lib/context";
import { useState } from "react";

// ─── Navigation Structure ─────────────────────────────────────────────────────

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  alwaysEnabled?: boolean;
  badge?: string;
}

interface NavSection {
  id: string;
  label: string;
  emoji: string;
  color: string;
  items: NavItem[];
  defaultOpen?: boolean;
}

const NAV_SECTIONS: NavSection[] = [
  {
    id: "skripsi",
    label: "Skripsi",
    emoji: "🎓",
    color: "text-blue-700",
    defaultOpen: true,
    items: [
      { href: "/judul",          label: "Generator Judul",      icon: BookOpen,      alwaysEnabled: true },
      { href: "/kuesioner",      label: "Kuesioner",            icon: ClipboardList, alwaysEnabled: true },
      { href: "/variabel",       label: "Belajar Variabel",     icon: BookMarked,    alwaysEnabled: true },
      { href: "/latar-belakang", label: "Latar Belakang",       icon: Newspaper,     alwaysEnabled: true },
      { href: "/kerangka",       label: "Kerangka Berpikir",    icon: GitFork,       alwaysEnabled: true },
      { href: "/operasional",    label: "Operasional Variabel", icon: Table2,        alwaysEnabled: true },
      { href: "/responden",      label: "Responden Center",     icon: Users,         alwaysEnabled: true },
      { href: "/upload",         label: "Upload Data",          icon: Upload,        alwaysEnabled: true },
      { href: "/mapping",        label: "Mapping Variabel",     icon: Settings2 },
      { href: "/kelayakan",      label: "Cek Kelayakan",        icon: CheckCircle },
      { href: "/deskriptif",     label: "Deskriptif",           icon: BarChart2 },
      { href: "/validitas",      label: "Validitas",            icon: CheckCircle },
      { href: "/reliabilitas",   label: "Reliabilitas",         icon: ShieldCheck },
      { href: "/regresi",        label: "Regresi",              icon: TrendingUp },
      { href: "/narasi",         label: "Narasi Bab 4",         icon: FileText },
    ],
  },
  {
    id: "makalah",
    label: "Makalah",
    emoji: "📚",
    color: "text-violet-700",
    defaultOpen: false,
    items: [
      { href: "/makalah", label: "Buat Makalah", icon: BookCopy, alwaysEnabled: true, badge: "Beta" },
    ],
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

interface SidebarProps { open: boolean; onClose: () => void; }

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname  = usePathname();
  const { state } = useAppContext();
  const hasData    = state.rawData.length > 0;
  const hasMapping = state.variables.length > 0;

  // Track which sections are collapsed
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    NAV_SECTIONS.forEach((s) => { init[s.id] = !(s.defaultOpen ?? true); });
    return init;
  });

  function toggleSection(id: string) {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function isItemDisabled(item: NavItem): boolean {
    if (item.alwaysEnabled) return false;
    if (item.href === "/upload") return false;
    if (item.href === "/mapping") return !hasData;
    return !hasData || !hasMapping;
  }

  function NavLink({ item }: { item: NavItem }) {
    const disabled = isItemDisabled(item);
    const active   = pathname === item.href;
    const Icon     = item.icon;
    return (
      <Link
        href={disabled ? "#" : item.href}
        onClick={(e) => { if (disabled) e.preventDefault(); else onClose(); }}
        className={cn(
          "flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors group",
          active   ? "bg-blue-50 text-blue-700"
          : disabled ? "text-slate-300 cursor-not-allowed"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        )}
      >
        <Icon className={cn("w-4 h-4 shrink-0",
          active ? "text-blue-600" : disabled ? "text-slate-300" : "text-slate-400 group-hover:text-slate-600"
        )} />
        <span className="truncate text-xs">{item.label}</span>
        {item.badge && (
          <span className="ml-auto text-[9px] font-bold bg-violet-500 text-white px-1 py-0.5 rounded-full uppercase shrink-0">
            {item.badge}
          </span>
        )}
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

        {/* Brand */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-200">
          <Link href="/" onClick={onClose} className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-base shrink-0">
              🎓
            </div>
            <div className="min-w-0">
              <p className="text-sm font-extrabold text-slate-900 leading-tight">SmartCampus</p>
              <p className="text-[10px] text-slate-400 leading-tight">Academic Workspace</p>
            </div>
          </Link>
          <button className="lg:hidden text-slate-400 hover:text-slate-600 p-1 shrink-0" onClick={onClose}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Workspace links */}
        <div className="px-2 pt-3 pb-1.5 space-y-0.5">
          {[
            { href: "/",        label: "Beranda",  icon: LayoutDashboard },
            { href: "/project", label: "Project",  icon: FolderOpen },
          ].map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors",
                pathname === href ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <Icon className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-xs">{label}</span>
            </Link>
          ))}
        </div>

        {/* Data badge */}
        {state.fileName && (
          <div className="mx-2 mb-1 px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg">
            <p className="text-[10px] text-emerald-700 font-semibold truncate">✓ {state.fileName}</p>
            <p className="text-[10px] text-emerald-600">{state.rawData.length} responden</p>
          </div>
        )}

        {/* Divider */}
        <div className="mx-3 border-t border-slate-100 my-1" />

        {/* Academic module sections */}
        <nav className="flex-1 px-2 py-1 overflow-y-auto space-y-1">
          {NAV_SECTIONS.map((section) => {
            const isCollapsed = collapsed[section.id];
            return (
              <div key={section.id}>
                {/* Section header */}
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-50 transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{section.emoji}</span>
                    <span className={cn("text-[11px] font-bold uppercase tracking-wider", section.color)}>
                      {section.label}
                    </span>
                  </div>
                  {isCollapsed
                    ? <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-slate-500" />
                    : <ChevronDown  className="w-3 h-3 text-slate-300 group-hover:text-slate-500" />
                  }
                </button>

                {/* Section items */}
                {!isCollapsed && (
                  <div className="pl-1 space-y-0.5 mt-0.5">
                    {section.items.map((item) => (
                      <NavLink key={item.href} item={item} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-2 py-2.5 border-t border-slate-200 space-y-0.5">
          {[
            { href: "/settings",          label: "Pengaturan",    icon: Settings },
            { href: "/settings/template", label: "Template Kampus", icon: Layers },
          ].map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors",
                pathname === href ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              )}
            >
              <Icon className="w-4 h-4 text-slate-400 shrink-0" />
              {label}
            </Link>
          ))}
        </div>
      </aside>
    </>
  );
}
