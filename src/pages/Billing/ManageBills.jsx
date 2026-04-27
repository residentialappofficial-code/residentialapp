import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Filter, CheckCircle, Clock, AlertCircle, FileText, Send } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export default function ManageBills() {
  const { selectedPerumahanId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const fetchBills = useCallback(async () => {
    if (!selectedPerumahanId) return;
    try {
      setLoading(true);
      const { data: bills, error } = await supabase
        .from("tagihan")
        .select(`
          *,
          warga:warga_id(nama, blok)
        `)
        .eq("perumahan_id", selectedPerumahanId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setData(bills || []);
    } catch (err) {
      console.error("Error fetching bills:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedPerumahanId]);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  const handleGenerateBills = async () => {
    if (!window.confirm(`Generate tagihan untuk semua warga untuk bulan ${currentMonth}/${currentYear}?`)) return;
    
    setGenerating(true);
    try {
      // 1. Ambil Config
      const { data: config, error: configError } = await supabase
        .from("iuran_config")
        .select("*")
        .eq("perumahan_id", selectedPerumahanId)
        .maybeSingle();

      if (!config) throw new Error("Konfigurasi iuran belum diatur. Silakan atur di menu Iuran Config.");
      if (configError) throw configError;

      // 2. Ambil semua warga aktif
      const { data: warga, error: wargaError } = await supabase
        .from("warga")
        .select("id, luas_tanah")
        .eq("perumahan_id", selectedPerumahanId)
        .eq("status_aktif", true);

      if (wargaError) throw wargaError;
      if (!warga || warga.length === 0) throw new Error("Tidak ada warga aktif untuk diberikan tagihan.");

      // 3. Siapkan data tagihan
      const newBills = warga.map(w => {
        const jumlah = config.tipe === "flat" 
          ? config.tarif_dasar 
          : (config.tarif_dasar * (w.luas_tanah || 0));
        
        return {
          warga_id: w.id,
          perumahan_id: selectedPerumahanId,
          bulan: currentMonth,
          tahun: currentYear,
          jumlah: jumlah,
          status: "Unpaid"
        };
      });

      // 4. Insert ke database (Batch)
      const { error: insertError } = await supabase
        .from("tagihan")
        .insert(newBills);

      if (insertError) throw insertError;

      alert(`Berhasil men-generate ${newBills.length} tagihan!`);
      fetchBills();
    } catch (err) {
      alert("Gagal generate tagihan: " + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const filteredData = data.filter(item => 
    item.warga?.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.warga?.blok?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manajemen Tagihan</h1>
          <p className="text-slate-500 text-sm">Kelola tagihan iuran bulanan warga.</p>
        </div>
        <button
          onClick={handleGenerateBills}
          disabled={generating}
          className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {generating ? "Generating..." : `Generate Tagihan ${currentMonth}/${currentYear}`}
        </button>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari warga atau blok..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-600 transition-all"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-50 transition-all">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Warga / Blok</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Periode</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Jumlah</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-4"><div className="h-5 bg-slate-100 rounded"></div></td>
                  </tr>
                ))
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-slate-400 font-medium">Belum ada tagihan yang dibuat.</td>
                </tr>
              ) : filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-all">
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-900">{item.warga?.nama}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.warga?.blok}</p>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-600">
                    Bulan {item.bulan}, {item.tahun}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-900">Rp {item.jumlah.toLocaleString()}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      item.status === 'Paid' ? 'bg-green-50 text-green-600' : 
                      item.status === 'Pending' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {item.status === 'Paid' ? <CheckCircle className="w-3 h-3" /> : 
                       item.status === 'Pending' ? <Clock className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                      {item.status}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Lihat Detail">
                        <FileText className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Kirim Pengingat">
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
