import { useState, useEffect, useCallback } from "react";
import { Hammer, Plus, History, CheckCircle, Clock, Trash2, User, Calendar, X, Edit, DollarSign, FileText } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Modal, Button, Input, Select, Badge, Card, CardHeader, Table, THead, TBody, TR, TH, TD, Textarea } from "@/components/ui";

export default function AssetTracking() {
  const { selectedPerumahanId, profile } = useAuth();
  const [assets, setAssets] = useState([]);
  const [loans, setLoans] = useState([]);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [assetForm, setAssetForm] = useState({ nama_aset: "", kondisi: "Baik" });
  const [loanForm, setLoanForm] = useState({ aset_id: "", warga_id: "", catatan: "" });
  const [wargaList, setWargaList] = useState([]);

  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin' || !!profile?.pengurus;

  const fetchData = useCallback(async () => {
    if (!selectedPerumahanId) {
      console.log("AssetTracking: selectedPerumahanId is missing");
      return;
    }
    console.log("AssetTracking: Fetching data for perumahan_id:", selectedPerumahanId);
    try {
      const { data: assetData } = await supabase
        .from("aset_komplek")
        .select("*")
        .eq("perumahan_id", selectedPerumahanId)
        .order("nama_aset");
      
      setAssets(assetData || []);

      const { data: loanData } = await supabase
        .from("peminjaman_aset")
        .select(`
          *,
          aset:aset_komplek!aset_id(nama_aset),
          warga:warga!warga_id(nama, blok)
        `)
        .eq("perumahan_id", selectedPerumahanId)
        .order("tanggal_pinjam", { ascending: false });
      
      setLoans(loanData || []);

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
      nama_aset: item.nama_aset || "",
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
          .insert([{ ...assetForm, perumahan_id: selectedPerumahanId, status: 'Available' }]);
        if (error) throw error;
      }
      
      setIsAssetModalOpen(false);
      setIsEditMode(false);
      setEditingId(null);
      setAssetForm({ nama_aset: "", kondisi: "Baik" });
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
          status: 'Borrowed',
          tanggal_pinjam: new Date().toISOString().split('T')[0]
        }]);
      if (loanError) throw loanError;

      const { error: assetError } = await supabase
        .from("aset_komplek")
        .update({ status: 'Borrowed' })
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
      await supabase.from("peminjaman_aset").update({ status: 'Returned', tanggal_kembali: new Date().toISOString().split('T')[0] }).eq("id", loanId);
      await supabase.from("aset_komplek").update({ status: 'Available' }).eq("id", assetId);
      fetchData();
    } catch {
      alert("Gagal update pengembalian");
    }
  };

  const handleApproveLoan = async (loanId, assetId) => {
    if (!window.confirm("Setujui peminjaman ini?")) return;
    try {
      // 1. Update loan status to 'Borrowed' (Approved and active)
      const { error: loanError } = await supabase
        .from("peminjaman_aset")
        .update({ status: 'Borrowed' })
        .eq("id", loanId);
      if (loanError) throw loanError;

      // 2. Update asset status to 'Borrowed'
      const { error: assetError } = await supabase
        .from("aset_komplek")
        .update({ status: 'Borrowed' })
        .eq("id", assetId);
      if (assetError) throw assetError;

      fetchData();
    } catch (err) {
      alert("Gagal menyetujui: " + err.message);
    }
  };

  const handleRejectLoan = async (loanId) => {
    if (!window.confirm("Tolak peminjaman ini?")) return;
    try {
      const { error } = await supabase
        .from("peminjaman_aset")
        .update({ status: 'Rejected' })
        .eq("id", loanId);
      if (error) throw error;
      fetchData();
    } catch (err) {
      alert("Gagal menolak: " + err.message);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Ketersediaan Aset</h1>
          <p className="text-slate-500 text-sm mt-1">Pantau status dan pelacakan peminjaman alat warga.</p>
        </div>
        {isAdmin && (
          <div className="flex gap-3">
            <Button
              variant="outline"
              icon={Plus}
              size="md"
              onClick={() => {
                setIsEditMode(false);
                setEditingId(null);
                setAssetForm({ nama_aset: "", kondisi: "Baik" });
                setIsAssetModalOpen(true);
              }}
            >
              Tambah Aset
            </Button>
            <Button
              variant="primary"
              size="md"
              icon={Hammer}
              onClick={() => setIsLoanModalOpen(true)}
            >
              Catat Pinjam
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2">Ketersediaan Alat</h2>
          <div className="grid grid-cols-1 gap-4">
            {assets.map(asset => (
              <Card key={asset.id} className="p-6 group hover:border-slate-300 transition-all">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 duration-500 ${asset.status === 'Available' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-300'}`}>
                      <Hammer className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 tracking-tight mb-0.5">{asset.nama_aset}</p>
                      <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Kondisi: {asset.kondisi}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant={asset.status === 'Available' ? 'green' : 'indigo'}>
                      {asset.status === 'Available' ? 'Tersedia' : 'Dipinjam'}
                    </Badge>
                    {isAdmin && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => handleEditAsset(asset)} className="p-1.5 text-slate-400 hover:text-slate-950 hover:bg-slate-50 rounded-lg transition-colors"><Edit className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDeleteAsset(asset.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2">Riwayat Peminjaman</h2>
          <Card noPadding>
            <Table>
              <THead>
                <TR isHeader>
                  <TH>Alat / Aset</TH>
                  <TH>Identitas Peminjam</TH>
                  <TH>Waktu Pinjam</TH>
                  <TH>Status Log</TH>
                  <TH textAlign="right">Aksi</TH>
                </TR>
              </THead>
              <TBody>
                {loans.length === 0 ? (
                  <TR><TD colSpan={5} textAlign="center" className="py-24 text-[10px] font-bold tracking-[0.3em] text-slate-400 uppercase">Belum ada riwayat peminjaman.</TD></TR>
                ) : loans.map(loan => (
                  <TR key={loan.id} className="group transition-all">
                    <TD className="text-sm font-semibold text-slate-900 tracking-tight">{loan.aset?.nama_aset}</TD>
                    <TD>
                      <div className="flex flex-col">
                        <p className="font-semibold text-slate-900 text-xs tracking-tight mb-0.5">{loan.warga?.nama}</p>
                        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{loan.warga?.blok}</p>
                      </div>
                    </TD>
                    <TD className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                      {new Date(loan.tanggal_pinjam).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </TD>
                    <TD>
                      <Badge variant={
                        loan.status === 'Returned' ? 'green' : 
                        loan.status === 'Borrowed' ? 'orange' :
                        loan.status === 'Pending' ? 'indigo' : 'slate'
                      }>
                        {loan.status === 'Returned' ? 'Dikembalikan' : 
                         loan.status === 'Borrowed' ? 'Dipinjam' :
                         loan.status === 'Pending' ? 'Menunggu' : 'Ditolak'}
                      </Badge>
                    </TD>
                    <TD textAlign="right">
                      <div className="flex justify-end gap-2">
                        {loan.status === 'Pending' && isAdmin && (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => handleApproveLoan(loan.id, loan.aset_id)} className="text-emerald-600 hover:bg-emerald-50 font-bold text-[10px] uppercase tracking-wider">
                              Setujui
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleRejectLoan(loan.id)} className="text-rose-600 hover:bg-rose-50 font-bold text-[10px] uppercase tracking-wider">
                              Tolak
                            </Button>
                          </>
                        )}
                        {loan.status === 'Borrowed' && isAdmin && (
                          <Button variant="ghost" size="sm" onClick={() => handleReturnAsset(loan.id, loan.aset_id)} className="text-indigo-600 hover:bg-indigo-50 font-bold text-[10px] uppercase tracking-wider">
                            Kembalikan
                          </Button>
                        )}
                      </div>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </Card>
        </div>
      </div>

      <Modal
        isOpen={isAssetModalOpen}
        onClose={() => setIsAssetModalOpen(false)}
        title={isEditMode ? "Edit Aset" : "Tambah Aset Baru"}
      >
        <form onSubmit={handleAddAsset} className="space-y-10 p-2">
          <Input 
            label="Nama Alat"
            required 
            value={assetForm.nama_aset} 
            onChange={e => setAssetForm({...assetForm, nama_aset: e.target.value})}
            placeholder="e.g. Cangkul, Tangga"
            icon={Hammer}
          />
          <Select 
            label="Kondisi Aset"
            value={assetForm.kondisi} 
            onChange={e => setAssetForm({...assetForm, kondisi: e.target.value})} 
          >
            <option value="Baik">Kondisi Baik</option>
            <option value="Rusak Ringan">Rusak Ringan</option>
            <option value="Perlu Perbaikan">Perlu Perbaikan</option>
          </Select>
          <div className="flex gap-4 pt-6">
            <Button variant="ghost" className="flex-1 py-2.5 font-semibold" onClick={() => setIsAssetModalOpen(false)}>Batal</Button>
            <Button variant="primary" className="flex-1 py-2.5 font-semibold" type="submit" isLoading={isSubmitting}>
              {isEditMode ? "Simpan Perubahan" : "Simpan Aset"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isLoanModalOpen}
        onClose={() => setIsLoanModalOpen(false)}
        title="Catat Peminjaman"
      >
        <form onSubmit={handleAddLoan} className="space-y-10 p-2">
          <Select 
            label="Pilih Alat"
            required 
            value={loanForm.aset_id} 
            onChange={e => setLoanForm({...loanForm, aset_id: e.target.value})} 
          >
            <option value="">-- Pilih Alat --</option>
            {assets.filter(a => a.status === 'Available').map(a => <option key={a.id} value={a.id}>{a.nama_aset}</option>)}
          </Select>
          <Select 
            label="Identitas Peminjam"
            required 
            value={loanForm.warga_id} 
            onChange={e => setLoanForm({...loanForm, warga_id: e.target.value})} 
          >
            <option value="">-- Pilih Warga --</option>
            {wargaList.map(w => <option key={w.id} value={w.id}>{w.nama} ({w.blok})</option>)}
          </Select>
          <Textarea 
            label="Catatan Log"
            value={loanForm.catatan} 
            onChange={e => setLoanForm({...loanForm, catatan: e.target.value})} 
            placeholder="Contoh: Digunakan untuk kerja bakti di blok A..." 
          />
          <div className="flex gap-4 pt-6">
            <Button variant="ghost" className="flex-1 py-2.5 font-semibold" onClick={() => setIsLoanModalOpen(false)}>Batal</Button>
            <Button variant="primary" className="flex-1 py-2.5 font-semibold" type="submit" isLoading={isSubmitting}>Konfirmasi Pinjam</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
