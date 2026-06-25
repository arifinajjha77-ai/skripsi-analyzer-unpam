"use client";

import { useState } from "react";
import Image from "next/image";
import { Menu } from "lucide-react";
import Sidebar from "./Sidebar";
import Breadcrumb from "@/components/Breadcrumb";

export default function AppShell({ children }: { children: React.ReactNode }) {
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
          {children}
        </main>
      </div>
    </div>
  );
}
