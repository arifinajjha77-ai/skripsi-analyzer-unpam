"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

const ROUTE_MAP: Record<string, { label: string; group?: string }> = {
  "/":               { label: "Dashboard" },
  "/project":        { label: "Project" },
  "/settings":          { label: "Pengaturan" },
  "/settings/template": { label: "Template Kampus", group: "Pengaturan" },
  "/judul":          { label: "Generator Judul",      group: "Generator" },
  "/kuesioner":      { label: "Kuesioner",            group: "Generator" },
  "/latar-belakang": { label: "Latar Belakang",       group: "Generator" },
  "/kerangka":       { label: "Kerangka Berpikir",    group: "Generator" },
  "/operasional":    { label: "Operasional Variabel", group: "Generator" },
  "/responden":      { label: "Responden Center",     group: "Penelitian" },
  "/upload":         { label: "Upload Data",          group: "Penelitian" },
  "/mapping":        { label: "Mapping Variabel",     group: "Penelitian" },
  "/deskriptif":     { label: "Deskriptif",           group: "Analisis" },
  "/validitas":      { label: "Validitas",            group: "Analisis" },
  "/reliabilitas":   { label: "Reliabilitas",         group: "Analisis" },
  "/regresi":        { label: "Regresi",              group: "Analisis" },
  "/narasi":         { label: "Narasi Bab 4",         group: "Analisis" },
};

export default function Breadcrumb() {
  const pathname = usePathname();
  if (pathname === "/") return null;

  const meta = ROUTE_MAP[pathname];
  if (!meta) return null;

  const crumbs: { label: string; href?: string }[] = [{ label: "Dashboard", href: "/" }];
  if (meta.group) crumbs.push({ label: meta.group });
  crumbs.push({ label: meta.label });

  return (
    <nav className="flex items-center gap-1 text-sm text-slate-500 mb-4" aria-label="Breadcrumb">
      {crumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-300" />}
          {crumb.href ? (
            <Link href={crumb.href} className="hover:text-blue-600 flex items-center gap-1 transition-colors">
              {i === 0 && <Home className="w-3.5 h-3.5" />}
              {crumb.label}
            </Link>
          ) : (
            <span className={i === crumbs.length - 1 ? "text-slate-800 font-medium" : "text-slate-500"}>
              {crumb.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
