import { useState, useEffect, useCallback } from "react";
import { Plus, TrendingUp, TrendingDown, WalletCards, Search, MoreVertical, Filter, FileText } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

import { SelectionRequired } from "@/components/ui/SelectionRequired";

export default function ArusKas() {
  const { selectedPerumahanId, profile } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ masuk: 0, keluar: 0, saldo: 0 });
  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      if (!selectedPerumahanId) return;

      const { data: transactions } = await supabase
        .from('arus_kas')
        .select('*')
        .eq('perumahan_id', selectedPerumahanId)
        .order('tanggal', { ascending: false });
      
      setData(transactions || []);

      const masuk = transactions?.filter(t => t.tipe === "Masuk").reduce((acc, curr) => acc + curr.jumlah, 0) || 0;
      const keluar = transactions?.filter(t => t.tipe === "Keluar").reduce((acc, curr) => acc + curr.jumlah, 0) || 0;
      setSummary({ masuk, keluar, saldo: masuk - keluar });
    } catch {
      console.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, [selectedPerumahanId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredData = data.filter(item => 
    item.keterangan?.toLowerCase().includes(searchTerm.toLowerCase())
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
            <h1 className="text-2xl font-bold text-slate-900">Arus Kas</h1>
            <p className="text-slate-500 text-sm">Monitor aliran dana masuk dan keluar kompleks Anda.</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white rounded-lg font-semibold text-sm hover:bg-slate-50 transition-all">
              <FileText className="w-4 h-4 text-slate-400" /> Export PDF
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold text-sm hover:opacity-90 transition-all shadow-sm">
              <Plus className="w-4 h-4" /> Tambah Transaksi
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-600">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900">Rp {summary.masuk.toLocaleString()}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pemasukan</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center text-red-600">
              <TrendingDown className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900">Rp {summary.keluar.toLocaleString()}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pengeluaran</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
              <WalletCards className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900">Rp {summary.saldo.toLocaleString()}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Saldo Akhir</p>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-white flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 md:w-80">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Cari transaksi..."
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
                  <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-widest">Tanggal</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-widest">Keterangan</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-widest">Tipe</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-widest text-right">Jumlah</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-widest text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="px-6 py-4"><div className="h-4 bg-slate-100 rounded"></div></td>
                    </tr>
                  ))
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-slate-400 font-medium">Tidak ada transaksi.</td>
                  </tr>
                ) : filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 border-b border-slate-50 transition-all">
                    <td className="px-6 py-4 text-xs font-semibold text-slate-500">
                      {new Date(item.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-800">{item.keterangan}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        item.tipe === "Masuk" ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                      }`}>
                        {item.tipe}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-sm font-bold text-right ${
                      item.tipe === "Masuk" ? 'text-green-600' : 'text-red-600'
                    }`}>
                      Rp {item.jumlah?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-slate-400 hover:text-indigo-600 transition-all">
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
