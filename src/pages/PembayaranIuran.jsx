import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Search, Calendar, LayoutGrid, List, Filter, Download, CreditCard, Banknote, History } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

import { SelectionRequired } from "@/components/ui/SelectionRequired";

export default function PembayaranIuran() {
  const { profile, selectedPerumahanId } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      if (!selectedPerumahanId) return;

      const { data: payments, error } = await supabase
        .from('pembayaran_iuran')
        .select(`
          *,
          warga:warga(nama, blok)
        `)
        .eq('perumahan_id', selectedPerumahanId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setData(payments || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [selectedPerumahanId]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const filteredData = data.filter(item => 
    item.warga?.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.warga?.blok?.toLowerCase().includes(searchTerm.toLowerCase())
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
            <h1 className="text-2xl font-bold text-slate-900">Iuran Bulanan</h1>
            <p className="text-slate-500 text-sm">Kelola penagihan dan pantau status pembayaran iuran warga.</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white rounded-lg font-semibold text-sm hover:bg-slate-50 transition-all">
              <History className="w-4 h-4" /> Riwayat
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold text-sm hover:opacity-90 transition-all shadow-sm">
              <Plus className="w-4 h-4" /> Input Pembayaran
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-600">
              <Banknote className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900">Rp 12.450.000</p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Iuran Bulan Ini</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900">85%</p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Tingkat Pembayaran</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center text-orange-600">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900">12</p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Warga Belum Bayar</p>
            </div>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Filters & Tabs */}
          <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="relative flex-1 md:w-80">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="Cari warga..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:border-indigo-600 transition-all"
                />
              </div>
              <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-50 transition-all">
                <Filter className="w-4 h-4" /> Filter
              </button>
            </div>

            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button 
                onClick={() => setView("list")}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                  view === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <List className="w-3.5 h-3.5" /> Daftar
              </button>
              <button 
                onClick={() => setView("matrix")}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                  view === 'matrix' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" /> Matriks
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Warga & Blok</th>
                  <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bulan</th>
                  <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Jumlah</th>
                  <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Metode</th>
                  <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={6} className="px-8 py-6"><div className="h-5 bg-slate-100 rounded"></div></td>
                    </tr>
                  ))
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-20 text-center text-slate-400 font-medium">Tidak ada riwayat pembayaran.</td>
                  </tr>
                ) : filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 border-b border-slate-50 transition-all">
                    <td className="px-8 py-5">
                      <div>
                        <p className="text-sm font-bold text-slate-900">{item.warga?.nama}</p>
                        <p className="text-xs text-slate-500 font-medium">{item.warga?.blok}</p>
                      </div>
                    </td>
                    <td className="px-4 py-5 text-xs font-bold text-slate-700">Mei 2026</td>
                    <td className="px-4 py-5 text-sm font-bold text-slate-900">Rp {item.jumlah?.toLocaleString()}</td>
                    <td className="px-4 py-5">
                      <span className="px-2 py-0.5 border border-slate-200 rounded text-[10px] font-bold text-slate-500 uppercase">Transfer</span>
                    </td>
                    <td className="px-4 py-5">
                      <span className="px-2 py-0.5 bg-green-50 text-green-600 rounded text-[10px] font-bold uppercase">Lunas</span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button className="text-xs font-bold text-indigo-600 hover:underline">Detail</button>
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
