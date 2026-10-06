"use client";

import { usePathname } from "next/navigation";
import { FEB_2021 } from "@/lib/templates/feb2021";
import { useState } from "react";
import Image from "next/image";
import { Menu } from "lucide-react";
import Sidebar from "./Sidebar";
import Breadcrumb from "@/components/Breadcrumb";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const skripsiPage = ["/judul", "/kuesioner", "/variabel", "/latar-belakang", "/proposal", "/kerangka", "/operasional", "/responden", "/upload", "/mapping", "/kelayakan", "/deskriptif", "/validitas", "/reliabilitas", "/regresi", "/narasi"].includes(pathname);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-slate-500 hover:text-slate-800"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded overflow-hidden bg-white border border-slate-200 flex items-center justify-center shrink-0">
              <Image src="/logo-unpam.png" alt="UNPAM" width={28} height={28} className="object-contain w-7 h-7" />
            </div>
            <span className="font-semibold text-slate-700 text-sm">Skripsi Analyzer UNPAM</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <Breadcrumb />
          {skripsiPage && <section className="mb-5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-950">
            <div className="flex flex-wrap items-center justify-between gap-2"><strong>{FEB_2021.title} · {pathname === "/proposal" ? "Proposal Skripsi" : "Skripsi"}</strong><a href={FEB_2021.sourceUrl} target="_blank" rel="noreferrer" className="font-semibold underline">Buka pedoman</a></div>
            <p className="mt-1 text-xs">A4 · Times New Roman 12 · Spasi isi 2 · Atas/kiri 4 cm · Kanan/bawah 3 cm · Indentasi 1,5 cm</p>
            <p className="mt-1 text-xs">Tabel dan daftar pustaka 1 spasi. Referensi maksimal 10 tahun terakhir. Ekspor per menu menghasilkan bagian skripsi untuk digabungkan ke dokumen utama.</p>
          </section>}
          {children}
        </main>
      </div>
    </div>
  );
}
