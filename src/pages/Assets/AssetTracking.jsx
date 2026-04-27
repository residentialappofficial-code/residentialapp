import { useState, useEffect, useCallback } from "react";
import { Hammer, Plus, History, CheckCircle, Clock, Trash2, User, Calendar, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export default function AssetTracking() {
  const { selectedPerumahanId, profile } = useAuth();
  const [assets, setAssets] = useState([]);
  const [loans, setLoans] = useState([]);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [assetForm, setAssetForm] = useState({ nama_alat: "", kondisi: "Baik" });
  const [loanForm, setLoanForm] = useState({ aset_id: "", warga_id: "", catatan: "" });
  const [wargaList, setWargaList] = useState([]);

  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';

  const fetchData = useCallback(async () => {
    if (!selectedPerumahanId) return;
    try {
      // 1. Fetch Assets
      const { data: assetData } = await supabase
        .from("aset_komplek")
        .select("*")
        .eq("perumahan_id", selectedPerumahanId)
        .order("nama_alat");
      
      setAssets(assetData || []);

      // 2. Fetch Loans
      const { data: loanData } = await supabase
        .from("peminjaman_aset")
        .select(`
          *,
          aset:aset_id(nama_alat),
          warga:warga_id(nama, blok)
        `)
        .eq("perumahan_id", selectedPerumahanId)
        .order("tgl_pinjam", { ascending: false });
      
      setLoans(loanData || []);

      // 3. Fetch Warga for loan modal
      const { data: wargaData } = await supabase
        .from("warga")
        .select("id, nama, blok")
        .eq("perumahan_id", selectedPerumahanId)
        .eq("status_aktif", true);
      
      setWargaList(wargaData || []);
    } catch (err) {
      console.error("Error fetching assets:", err);
    }
  }, [selectedPerumahanId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddAsset = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("aset_komplek")
        .insert([{ ...assetForm, perumahan_id: selectedPerumahanId }]);
      if (error) throw error;
      setIsAssetModalOpen(false);
      setAssetForm({ nama_alat: "", kondisi: "Baik" });
      fetchData();
    } catch (err) {
      alert("Gagal tambah aset: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddLoan = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // 1. Buat Peminjaman
      const { error: loanError } = await supabase
        .from("peminjaman_aset")
        .insert([{ 
          ...loanForm, 
          perumahan_id: selectedPerumahanId,
          status: 'Borrowed'
        }]);
      if (loanError) throw loanError;

      // 2. Update status aset
      const { error: assetError } = await supabase
        .from("aset_komplek")
        .update({ status_tersedia: false })
        .eq("id", loanForm.aset_id);
      
      if (assetError) throw assetError;

      setIsLoanModalOpen(false);
      setLoanForm({ aset_id: "", warga_id: "", catatan: "" });
      fetchData();
    } catch (err) {
      alert("Gagal simpan peminjaman: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReturnAsset = async (loanId, assetId) => {
    if (!window.confirm("Konfirmasi pengembalian alat?")) return;
    try {
      // 1. Update loan status
      await supabase.from("peminjaman_aset").update({ status: 'Returned', tgl_kembali: new Date() }).eq("id", loanId);
      // 2. Update asset status
      await supabase.from("aset_komplek").update({ status_tersedia: true }).eq("id", assetId);
      fetchData();
    } catch {
      alert("Gagal update pengembalian");
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Ketersediaan Aset</h1>
          <p className="text-slate-500 text-sm font-medium">Pantau status dan pelacakan peminjaman alat warga.</p>
        </div>
        {isAdmin && (
          <div className="flex gap-3">
            <button
              onClick={() => setIsAssetModalOpen(true)}
              className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Tambah Aset
            </button>
            <button
              onClick={() => setIsLoanModalOpen(true)}
              className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2"
            >
              <Hammer className="w-4 h-4" /> Catat Pinjam
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Assets List (Left) */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Ketersediaan Alat</h2>
          <div className="grid grid-cols-1 gap-3">
            {assets.map(asset => (
              <div key={asset.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${asset.status_tersedia ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-400'}`}>
                    <Hammer className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{asset.nama_alat}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kondisi: {asset.kondisi}</p>
                  </div>
                </div>
                <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${asset.status_tersedia ? 'text-green-600' : 'text-amber-600'}`}>
                  {asset.status_tersedia ? 'Tersedia' : 'Dipinjam'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Loan History (Right) */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Riwayat Peminjaman</h2>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Alat</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Peminjam</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Waktu Pinjam</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm">
                  {loans.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-400">Belum ada riwayat peminjaman.</td></tr>
                  ) : loans.map(loan => (
                    <tr key={loan.id} className="hover:bg-slate-50 transition-all">
                      <td className="px-6 py-4 font-bold text-slate-900">{loan.aset?.nama_alat}</td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-700">{loan.warga?.nama}</p>
                        <p className="text-[10px] font-bold text-slate-400">{loan.warga?.blok}</p>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {new Date(loan.tgl_pinjam).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${loan.status === 'Returned' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                          {loan.status === 'Returned' ? 'Dikembalikan' : 'Sedang Dipinjam'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {loan.status === 'Borrowed' && isAdmin && (
                          <button 
                            onClick={() => handleReturnAsset(loan.id, loan.aset_id)}
                            className="text-xs font-bold text-indigo-600 hover:underline"
                          >
                            Kembalikan
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Asset Modal */}
      {isAssetModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8 animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Tambah Aset Baru</h3>
            <form onSubmit={handleAddAsset} className="space-y-4">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nama Alat</label>
                <input required value={assetForm.nama_alat} onChange={e => setAssetForm({...assetForm, nama_alat: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-600" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kondisi</label>
                <select value={assetForm.kondisi} onChange={e => setAssetForm({...assetForm, kondisi: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <option value="Baik">Baik</option>
                  <option value="Rusak Ringan">Rusak Ringan</option>
                  <option value="Perlu Perbaikan">Perlu Perbaikan</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsAssetModalOpen(false)} className="flex-1 py-3 text-sm font-bold text-slate-400">Batal</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Loan Modal */}
      {isLoanModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8 animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Catat Peminjaman</h3>
            <form onSubmit={handleAddLoan} className="space-y-4">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pilih Alat</label>
                <select required value={loanForm.aset_id} onChange={e => setLoanForm({...loanForm, aset_id: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <option value="">-- Pilih Alat --</option>
                  {assets.filter(a => a.status_tersedia).map(a => <option key={a.id} value={a.id}>{a.nama_alat}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Peminjam</label>
                <select required value={loanForm.warga_id} onChange={e => setLoanForm({...loanForm, warga_id: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <option value="">-- Pilih Warga --</option>
                  {wargaList.map(w => <option key={w.id} value={w.id}>{w.nama} ({w.blok})</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Catatan</label>
                <textarea value={loanForm.catatan} onChange={e => setLoanForm({...loanForm, catatan: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl resize-none" rows={3} placeholder="Contoh: Digunakan untuk kerja bakti" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsLoanModalOpen(false)} className="flex-1 py-3 text-sm font-bold text-slate-400">Batal</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg">Catat Pinjam</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
