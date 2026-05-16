import { History, ArrowLeft, Terminal, Rocket, Bug, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, Badge, Button } from "@/components/ui";

export default function Changelog() {
  const versions = [
    {
      version: "3.0.3",
      date: "16 Mei 2026",
      status: "Latest",
      changes: [
        { type: "added", text: "Redesain premium untuk halaman Login, Register, dan Lupa Kata Sandi." },
        { type: "added", text: "Integrasi animasi slide-up-fade-in pada elemen autentikasi." },
        { type: "fixed", text: "Resolusi 'ReferenceError: ArrowRight is not defined' pada Sidebar." },
        { type: "improved", text: "Pembersihan props tidak terpakai pada komponen Dashboard." }
      ]
    },
    {
      version: "3.0.1",
      date: "16 Mei 2026",
      status: "Stable",
      changes: [
        { type: "added", text: "Fitur sembunyikan/tampilkan kata sandi di halaman Login & Register." },
        { type: "added", text: "Sistem desain monokrom premium slate-900 di seluruh modul." },
        { type: "added", text: "Halaman Changelog untuk pelacakan pembaruan sistem." },
        { type: "fixed", text: "Error 'Textarea is not defined' pada halaman Profil dan Komplek." },
        { type: "fixed", text: "Standardisasi import komponen UI untuk stabilitas sistem." },
        { type: "improved", text: "Pembersihan kode dan resolusi 15+ peringatan ESLint." }
      ]
    },
    {
      version: "3.0.0",
      date: "10 Mei 2026",
      status: "Major",
      changes: [
        { type: "added", text: "Peluncuran HABITIX Platform dengan arsitektur React 19." },
        { type: "added", text: "Integrasi Supabase untuk manajemen data real-time." },
        { type: "added", text: "Dashboard Warga dan Panel Admin terpadu." }
      ]
    }
  ];

  const getIcon = (type) => {
    switch (type) {
      case "added": return <Rocket className="w-3 h-3 text-emerald-500" />;
      case "fixed": return <Bug className="w-3 h-3 text-rose-500" />;
      case "improved": return <Zap className="w-3 h-3 text-amber-500" />;
      default: return <Terminal className="w-3 h-3 text-slate-400" />;
    }
  };

  return (
    <div className="flex flex-col gap-10 max-w-4xl mx-auto py-10">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <Link to="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors text-xs font-bold uppercase tracking-widest mb-4">
            <ArrowLeft className="w-3 h-3" /> Kembali ke Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <History className="w-8 h-8 text-indigo-600" /> Catatan Pembaruan
          </h1>
          <p className="text-slate-500 text-sm">Riwayat perubahan dan peningkatan platform HABITIX.</p>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        {versions.map((v, i) => (
          <div key={i} className="relative pl-12 border-l-2 border-slate-100 pb-12 last:pb-0 last:border-l-transparent">
            <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-white border-4 border-indigo-600 shadow-sm z-10"></div>
            
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">v{v.version}</h2>
                <Badge variant={v.status === 'Latest' ? 'indigo' : 'slate'} className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md">
                  {v.status}
                </Badge>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{v.date}</span>
              </div>

              <Card className="p-6 hover:shadow-md transition-shadow">
                <div className="grid grid-cols-1 gap-4">
                  {v.changes.map((change, ci) => (
                    <div key={ci} className="flex items-start gap-4 group">
                      <div className="mt-1 flex-shrink-0">
                        {getIcon(change.type)}
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-bold uppercase tracking-[0.2em] ${
                            change.type === 'added' ? 'text-emerald-600' : 
                            change.type === 'fixed' ? 'text-rose-600' : 
                            'text-amber-600'
                          }`}>
                            {change.type}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 font-medium leading-relaxed group-hover:text-slate-900 transition-colors">
                          {change.text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 p-10 bg-slate-50 rounded-3xl border border-slate-100 text-center space-y-4">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em]">Masa Depan Platform</p>
        <h3 className="text-lg font-bold text-slate-900 tracking-tight">Terus Berinovasi Untuk Hunian Anda</h3>
        <p className="text-sm text-slate-500 max-w-lg mx-auto leading-relaxed">
          Kami sedang mengerjakan modul laporan keuangan yang lebih mendalam dan sistem reservasi fasilitas yang ditingkatkan. Nantikan pembaruan berikutnya!
        </p>
      </div>
    </div>
  );
}
