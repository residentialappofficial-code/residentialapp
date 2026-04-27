import { useState, useEffect, useCallback } from "react";
import { Plus, Edit, Trash2, Search, MoreVertical, Briefcase, DollarSign, Filter, CreditCard, Banknote, History } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

import { SelectionRequired } from "@/components/ui/SelectionRequired";

export default function Penggajian() {
  const { selectedPerumahanId, profile } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchPayroll = useCallback(async () => {
    try {
      setLoading(true);
      if (!selectedPerumahanId) return;
      const { data: payroll } = await supabase
        .from('penggajian')
        .select('*')
        .eq('perumahan_id', selectedPerumahanId)
        .order('tanggal', { ascending: false });
      
      setData(payroll || []);
    } catch {
      console.error("Gagal memuat data gaji");
    } finally {
      setLoading(false);
    }
  }, [selectedPerumahanId]);

  useEffect(() => {
    fetchPayroll();
  }, [fetchPayroll]);

  const filteredData = data.filter(item => 
    item.nama_staf?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.jabatan?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (profile?.role === 'super_admin' && !selectedPerumahanId) {
    return <SelectionRequired />;
  }

  return (
    <div className="bg-transparent">
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Penggajian Staf</h1>
            <p className="text-slate-500 text-sm font-medium">Kelola slip gaji dan riwayat pembayaran untuk staf perumahan.</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white rounded-lg font-semibold text-sm hover:bg-slate-50 transition-all shadow-sm">
              <History className="w-4 h-4" /> Riwayat
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold text-sm hover:opacity-90 transition-all shadow-md">
              <Plus className="w-4 h-4" /> Input Gaji
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">8</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Staf Aktif</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-600">
              <Banknote className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">Rp 24.5M</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Pengeluaran Gaji</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center text-purple-600">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">Lunas</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status Bulan Ini</p>
            </div>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative flex-1 md:w-80">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Cari nama staf..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:border-indigo-600 transition-all"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-50 transition-all">
              <Filter className="w-4 h-4" /> Filter
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nama Staf</th>
                  <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Jabatan</th>
                  <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bulan</th>
                  <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Jumlah Gaji</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="px-8 py-6"><div className="h-5 bg-slate-100 rounded"></div></td>
                    </tr>
                  ))
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center text-slate-400 font-medium">Tidak ada data penggajian.</td>
                  </tr>
                ) : filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 border-b border-slate-50 transition-all">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-slate-800 rounded flex items-center justify-center text-white text-[10px] font-bold">
                          {item.nama_staf?.charAt(0)}
                        </div>
                        <span className="text-sm font-bold text-slate-900">{item.nama_staf}</span>
                      </div>
                    </td>
                    <td className="px-4 py-5 text-xs font-bold text-slate-600">{item.jabatan}</td>
                    <td className="px-4 py-5 text-xs font-bold text-slate-600">April 2026</td>
                    <td className="px-4 py-5 text-sm font-bold text-slate-900 text-right">
                      Rp {item.jumlah?.toLocaleString()}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
