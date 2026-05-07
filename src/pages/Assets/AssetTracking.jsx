import { useState, useEffect, useCallback } from "react";
import { Hammer, Plus, History, CheckCircle, Clock, Trash2, User, Calendar, X, Edit, DollarSign, FileText } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Modal, Button, Input } from "@/components/ui";

export default function AssetTracking() {
 const { selectedPerumahanId, profile } = useAuth();
 const [assets, setAssets] = useState([]);
 const [loans, setLoans] = useState([]);
 const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
 const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [isEditMode, setIsEditMode] = useState(false);
 const [editingId, setEditingId] = useState(null);
 
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

 const handleEditAsset = (item) => {
  setEditingId(item.id);
  setAssetForm({
   nama_alat: item.nama_alat || "",
   kondisi: item.kondisi || "Baik"
  });
  setIsEditMode(true);
  setIsAssetModalOpen(true);
 };

 const handleDeleteAsset = async (id) => {
  if (!window.confirm("Hapus aset ini secara permanen?")) return;
  try {
   const { error } = await supabase.from("aset_komplek").delete().eq("id", id);
   if (error) throw error;
   fetchData();
  } catch (err) {
   alert("Gagal menghapus: " + err.message);
  }
 };

 useEffect(() => {
  fetchData();
 }, [fetchData]);

 const handleAddAsset = async (e) => {
  if (e) e.preventDefault();
  setIsSubmitting(true);
  try {
   if (isEditMode) {
    const { error } = await supabase
     .from("aset_komplek")
     .update(assetForm)
     .eq("id", editingId);
    if (error) throw error;
   } else {
    const { error } = await supabase
     .from("aset_komplek")
     .insert([{ ...assetForm, perumahan_id: selectedPerumahanId }]);
    if (error) throw error;
   }
   
   setIsAssetModalOpen(false);
   setIsEditMode(false);
   setEditingId(null);
   setAssetForm({ nama_alat: "", kondisi: "Baik" });
   fetchData();
  } catch (err) {
   alert("Gagal menyimpan aset: " + err.message);
  } finally {
   setIsSubmitting(false);
  }
 };

 const handleAddLoan = async (e) => {
  if (e) e.preventDefault();
  setIsSubmitting(true);
  try {
   const { error: loanError } = await supabase
    .from("peminjaman_aset")
    .insert([{ 
     ...loanForm, 
     perumahan_id: selectedPerumahanId,
     status: 'Borrowed'
    }]);
   if (loanError) throw loanError;

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
   await supabase.from("peminjaman_aset").update({ status: 'Returned', tgl_kembali: new Date() }).eq("id", loanId);
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
     <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Ketersediaan Aset</h1>
     <p className="text-slate-500 text-sm font-medium">Pantau status dan pelacakan peminjaman alat warga.</p>
    </div>
    {isAdmin && (
     <div className="flex gap-3">
      <Button
       variant="outline"
       icon={Plus}
       onClick={() => {
        setIsEditMode(false);
        setEditingId(null);
        setAssetForm({ nama_alat: "", kondisi: "Baik" });
        setIsAssetModalOpen(true);
       }}
      >
       Tambah Aset
      </Button>
      <Button
       variant="primary"
       icon={Hammer}
       onClick={() => setIsLoanModalOpen(true)}
      >
       Catat Pinjam
      </Button>
     </div>
    )}
   </div>

   <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
    <div className="lg:col-span-1 space-y-4">
     <h2 className="text-xs font-bold text-slate-400  px-1">Ketersediaan Alat</h2>
     <div className="grid grid-cols-1 gap-3">
      {assets.map(asset => (
       <div key={asset.id} className="bg-white p-6 rounded-2xl border border-slate-100 flex justify-between items-center group">
        <div className="flex items-center gap-4">
         <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${asset.status_tersedia ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-400'}`}>
          <Hammer className="w-5 h-5" />
         </div>
         <div>
          <p className="text-sm font-bold text-slate-900 tracking-tight">{asset.nama_alat}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kondisi: {asset.kondisi}</p>
         </div>
        </div>
        <div className="flex flex-col items-end gap-1">
         <Badge variant={asset.status_tersedia ? 'green' : 'orange'}>
          {asset.status_tersedia ? 'Tersedia' : 'Dipinjam'}
         </Badge>
         {isAdmin && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
           <button onClick={() => handleEditAsset(asset)} className="p-1.5 text-slate-300 hover:text-slate-900 transition-colors"><Edit className="w-3.5 h-3.5" /></button>
           <button onClick={() => handleDeleteAsset(asset.id)} className="p-1.5 text-slate-300 hover:text-red-600 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
         )}
        </div>
       </div>
      ))}
     </div>
    </div>

    <div className="lg:col-span-2 space-y-4">
     <h2 className="text-xs font-bold text-slate-400  px-1">Riwayat Peminjaman</h2>
     <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <div className="overflow-x-auto">
       <table className="w-full text-left">
        <thead>
         <tr className="bg-slate-50/50 border-b border-slate-100">
          <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Alat</th>
          <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Peminjam</th>
          <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Waktu Pinjam</th>
          <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
          <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Aksi</th>
         </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 text-sm">
         {loans.length === 0 ? (
          <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-bold text-xs">Belum ada riwayat peminjaman.</td></tr>
         ) : loans.map(loan => (
          <tr key={loan.id} className="hover:bg-slate-50/50 transition-all group">
           <td className="px-6 py-4 font-bold text-slate-900 tracking-tight">{loan.aset?.nama_alat}</td>
           <td className="px-6 py-4">
            <p className="font-bold text-slate-800 text-xs tracking-tight">{loan.warga?.nama}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase">{loan.warga?.blok}</p>
           </td>
           <td className="px-6 py-4 text-xs text-slate-500 font-medium">
            {new Date(loan.tgl_pinjam).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
           </td>
           <td className="px-6 py-4">
            <Badge variant={loan.status === 'Returned' ? 'green' : 'orange'}>
             {loan.status === 'Returned' ? 'Dikembalikan' : 'Dipinjam'}
            </Badge>
           </td>
           <td className="px-6 py-4 text-right">
            {loan.status === 'Borrowed' && isAdmin && (
             <Button variant="ghost" size="sm" onClick={() => handleReturnAsset(loan.id, loan.aset_id)}>
              Kembalikan
             </Button>
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

   <Modal
    isOpen={isAssetModalOpen}
    onClose={() => setIsAssetModalOpen(false)}
    title={isEditMode ? "Edit Aset" : "Tambah Aset Baru"}
   >
    <form onSubmit={handleAddAsset} className="space-y-6">
     <Input 
      label="Nama Alat"
      required 
      value={assetForm.nama_alat} 
      onChange={e => setAssetForm({...assetForm, nama_alat: e.target.value})}
      placeholder="e.g. Cangkul, Tangga"
     />
     <div className="space-y-2">
      <label className="text-xs font-bold text-slate-400 ml-1">Kondisi</label>
      <select 
       value={assetForm.kondisi} 
       onChange={e => setAssetForm({...assetForm, kondisi: e.target.value})} 
       className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-slate-950 font-bold text-sm"
      >
       <option value="Baik">Baik</option>
       <option value="Rusak Ringan">Rusak Ringan</option>
       <option value="Perlu Perbaikan">Perlu Perbaikan</option>
      </select>
     </div>
     <div className="flex gap-4 pt-4">
      <Button variant="ghost" className="flex-1" onClick={() => setIsAssetModalOpen(false)}>Batal</Button>
      <Button variant="primary" className="flex-1" type="submit" isLoading={isSubmitting}>
       {isEditMode ? "Update" : "Simpan"}
      </Button>
     </div>
    </form>
   </Modal>

   <Modal
    isOpen={isLoanModalOpen}
    onClose={() => setIsLoanModalOpen(false)}
    title="Catat Peminjaman"
   >
    <form onSubmit={handleAddLoan} className="space-y-6">
     <div className="space-y-2">
      <label className="text-xs font-bold text-slate-400 ml-1">Pilih Alat</label>
      <select 
       required 
       value={loanForm.aset_id} 
       onChange={e => setLoanForm({...loanForm, aset_id: e.target.value})} 
       className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-slate-950 font-bold text-sm"
      >
       <option value="">-- Pilih Alat --</option>
       {assets.filter(a => a.status_tersedia).map(a => <option key={a.id} value={a.id}>{a.nama_alat}</option>)}
      </select>
     </div>
     <div className="space-y-2">
      <label className="text-xs font-bold text-slate-400 ml-1">Peminjam</label>
      <select 
       required 
       value={loanForm.warga_id} 
       onChange={e => setLoanForm({...loanForm, warga_id: e.target.value})} 
       className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-slate-950 font-bold text-sm"
      >
       <option value="">-- Pilih Warga --</option>
       {wargaList.map(w => <option key={w.id} value={w.id}>{w.nama} ({w.blok})</option>)}
      </select>
     </div>
     <div className="space-y-2">
      <label className="text-xs font-bold text-slate-400 ml-1">Catatan</label>
      <textarea 
       value={loanForm.catatan} 
       onChange={e => setLoanForm({...loanForm, catatan: e.target.value})} 
       className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-slate-950 font-bold text-sm resize-none" 
       rows={3} 
       placeholder="Contoh: Digunakan untuk kerja bakti" 
      />
     </div>
     <div className="flex gap-4 pt-4">
      <Button variant="ghost" className="flex-1" onClick={() => setIsLoanModalOpen(false)}>Batal</Button>
      <Button variant="primary" className="flex-1" type="submit" isLoading={isSubmitting}>Catat Pinjam</Button>
     </div>
    </form>
   </Modal>
  </div>
 );
}
