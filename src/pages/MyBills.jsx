import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { ReceiptText, Upload, Clock, CheckCircle2, AlertCircle, X, CreditCard } from "lucide-react";

export default function MyBills() {
  const { profile } = useAuth();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  const fetchBills = useCallback(async () => {
    try {
      setLoading(true);
      if (!profile?.id) return;
      
      const { data, error } = await supabase
        .from('tagihan')
        .select('*')
        .eq('warga_id', profile.id)
        .order('tahun', { ascending: false })
        .order('bulan', { ascending: false });
      
      if (error) throw error;
      setBills(data || []);
    } catch (error) {
      console.error("Gagal memuat tagihan:", error.message);
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      
      // Upload ke Storage Bucket 'receipts'
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`;
      const filePath = `receipts/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('receipts')
        .getPublicUrl(filePath);

      // Update tabel tagihan
      const { error: updateError } = await supabase
        .from('tagihan')
        .update({ 
          bukti_bayar_url: publicUrl,
          status: 'Pending'
        })
        .eq('id', selectedBill.id);

      if (updateError) throw updateError;

      alert("Bukti bayar telah dikirim. Menunggu verifikasi admin.");
      setIsDialogOpen(false);
      fetchBills();
    } catch (error) {
      alert("Gagal upload: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-transparent">
      <div className="flex flex-col gap-6 max-w-4xl mx-auto">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Tagihan Saya</h1>
            <p className="text-slate-500 text-sm font-medium">Pantau status iuran bulanan Anda.</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Luas Tanah Anda</p>
            <p className="text-sm font-bold text-slate-900">{profile?.luas_tanah || 0} m²</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status Saat Ini</p>
              <p className="text-xl font-bold text-slate-900">
                {bills.some(b => b.status === 'Unpaid') ? 'Ada Tunggakan' : 'Lancar'}
              </p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center text-red-500">
              <ReceiptText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Tagihan Belum Dibayar</p>
              <p className="text-xl font-bold text-red-500">
                {bills.filter(b => b.status === 'Unpaid').length} Bulan
              </p>
            </div>
          </div>
        </div>

        {/* Bank Account Info */}
        <div className="bg-indigo-600 p-6 rounded-2xl text-white shadow-lg shadow-indigo-100 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Rekening Pembayaran</p>
              <p className="text-lg font-bold">Bank Mandiri: 123-456-7890</p>
              <p className="text-xs opacity-80">A/N Paguyuban Cendana Residence</p>
            </div>
          </div>
          <div className="bg-white/10 px-4 py-2 rounded-lg border border-white/20 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Butuh Bantuan?</p>
            <p className="text-sm font-bold">Hubungi Admin</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bulan</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Jumlah</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array(3).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={4} className="px-6 py-8"><div className="h-5 bg-slate-100 rounded"></div></td>
                    </tr>
                  ))
                ) : bills.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-20 text-center text-slate-400 font-medium font-bold uppercase tracking-widest text-xs">Belum ada tagihan terbit.</td>
                  </tr>
                ) : bills.map((bill) => (
                  <tr key={bill.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-all">
                    <td className="px-6 py-5 text-sm font-bold text-slate-900">{months[bill.bulan-1]} {bill.tahun}</td>
                    <td className="px-6 py-5 text-sm font-bold text-slate-900">Rp {bill.jumlah.toLocaleString('id-ID')}</td>
                    <td className="px-6 py-5">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        bill.status === 'Paid' ? 'bg-green-50 text-green-600' :
                        bill.status === 'Pending' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-500'
                      }`}>
                        {bill.status === 'Paid' ? <CheckCircle2 className="w-3 h-3" /> : 
                         bill.status === 'Pending' ? <Clock className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                        {bill.status === 'Paid' ? 'Lunas' : bill.status === 'Pending' ? 'Verifikasi' : 'Belum Bayar'}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      {bill.status === 'Unpaid' && (
                        <button 
                          onClick={() => {
                            setSelectedBill(bill);
                            setIsDialogOpen(true);
                          }}
                          className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
                        >
                          Bayar
                        </button>
                      )}
                      {bill.status === 'Pending' && (
                        <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Proses Admin</span>
                      )}
                      {bill.status === 'Paid' && (
                        <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Selesai</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Upload Bukti Bayar */}
      {isDialogOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-900">Konfirmasi Pembayaran</h3>
              <button onClick={() => setIsDialogOpen(false)} className="text-slate-400 hover:text-slate-600 p-2">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8 flex flex-col gap-6">
              <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100 flex gap-4">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                </div>
                <p className="text-xs text-amber-800 font-bold leading-relaxed">
                  Pastikan nominal transfer sesuai dengan tagihan agar proses verifikasi lebih cepat.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pilih Foto Bukti Transfer</label>
                <label className="group relative cursor-pointer">
                  <div className={`w-full h-32 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 transition-all ${
                    uploading ? 'bg-slate-50 border-slate-200' : 'bg-slate-50 border-slate-200 hover:bg-indigo-50 hover:border-indigo-200'
                  }`}>
                    {uploading ? (
                      <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-slate-400 group-hover:text-indigo-600" />
                        <span className="text-[10px] font-bold text-slate-400 group-hover:text-indigo-600 uppercase tracking-widest">Klik untuk Pilih File</span>
                      </>
                    )}
                  </div>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setIsDialogOpen(false)}
                className="px-6 py-2 text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
