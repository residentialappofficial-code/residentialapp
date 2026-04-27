import { useState, useEffect, useCallback } from "react";
import { Search, CheckCircle, XCircle, Eye, ExternalLink, Calendar, User, Building } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export default function VerifyPayments() {
  const { selectedPerumahanId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const fetchPendingPayments = useCallback(async () => {
    if (!selectedPerumahanId) return;
    try {
      setLoading(true);
      const { data: bills, error } = await supabase
        .from("tagihan")
        .select(`
          *,
          warga:warga_id(nama, blok, no_hp)
        `)
        .eq("perumahan_id", selectedPerumahanId)
        .eq("status", "Pending")
        .order("created_at", { ascending: true });

      if (error) throw error;
      setData(bills || []);
    } catch (err) {
      console.error("Error fetching pending payments:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedPerumahanId]);

  useEffect(() => {
    fetchPendingPayments();
  }, [fetchPendingPayments]);

  const handleAction = async (id, newStatus) => {
    if (!window.confirm(`Konfirmasi pembayaran ini sebagai ${newStatus === 'Paid' ? 'LUNAS' : 'DITOLAK'}?`)) return;
    
    try {
      const { error } = await supabase
        .from("tagihan")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;
      
      alert(`Pembayaran berhasil ${newStatus === 'Paid' ? 'diverifikasi' : 'ditolak'}.`);
      fetchPendingPayments();
    } catch (err) {
      alert("Gagal melakukan aksi: " + err.message);
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
          <h1 className="text-2xl font-bold text-slate-900">Verifikasi Pembayaran</h1>
          <p className="text-slate-500 text-sm">Validasi bukti transfer iuran dari warga.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari warga atau blok..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-600 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Warga</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Periode</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Jumlah</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bukti</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array(3).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-4"><div className="h-5 bg-slate-100 rounded"></div></td>
                  </tr>
                ))
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-slate-400 font-medium">Tidak ada pembayaran yang perlu diverifikasi.</td>
                </tr>
              ) : filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-all">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-amber-50 rounded flex items-center justify-center text-amber-600 text-xs font-bold uppercase">
                        {item.warga?.nama?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{item.warga?.nama}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.warga?.blok}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="text-sm font-medium">{item.bulan}/{item.tahun}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-900">Rp {item.jumlah.toLocaleString()}</p>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => setSelectedReceipt(item.bukti_bayar_url)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" /> Lihat Bukti
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleAction(item.id, 'Unpaid')}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" 
                        title="Tolak Pembayaran"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleAction(item.id, 'Paid')}
                        className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all" 
                        title="Sahkan Lunas"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lightbox for Receipt */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[100] flex items-center justify-center p-8">
          <button 
            onClick={() => setSelectedReceipt(null)}
            className="absolute top-8 right-8 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all"
          >
            <XCircle className="w-8 h-8" />
          </button>
          <div className="max-w-4xl max-h-full flex flex-col items-center gap-4">
            <img 
              src={selectedReceipt} 
              alt="Bukti Transfer" 
              className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-white/20"
            />
            <a 
              href={selectedReceipt} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-white/70 hover:text-white font-bold text-sm transition-all"
            >
              <ExternalLink className="w-4 h-4" /> Buka di Tab Baru
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
