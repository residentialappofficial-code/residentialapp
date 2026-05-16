import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { ReceiptText, CheckCircle2, AlertCircle, CreditCard, ChevronRight, Copy, Check, MessageCircleQuestion, Plus, CheckSquare } from "lucide-react";
import { Button, Card, CardHeader, Table, THead, TBody, TR, TH, TD, Badge, Modal } from "@/components/ui";
import { calculateFinance, formatCurrency, formatDate } from "@/utils/financeUtils";

export default function MyBills() {
  const { profile } = useAuth();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState(null);
  
  // Multi-select state
  const [selectedBillIds, setSelectedBillIds] = useState([]);
  const [selectedBillDataForModal, setSelectedBillDataForModal] = useState(null);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [buktiBayar, setBuktiBayar] = useState("");
  const [copied, setCopied] = useState(false);

  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      if (!profile?.id) return;
      
      const [billsRes, configRes] = await Promise.all([
        supabase.from('tagihan').select('*').eq('warga_id', profile.id).order('tahun', { ascending: false }).order('bulan', { ascending: false }),
        supabase.from('iuran_config').select('*').eq('perumahan_id', profile.perumahan_id).maybeSingle()
      ]);
      
      if (billsRes.error) throw billsRes.error;
      setBills(billsRes.data || []);
      setConfig(configRes.data);
    } catch (error) {
      console.error("Gagal memuat data:", error.message);
    } finally {
      setLoading(false);
    }
  }, [profile?.id, profile?.perumahan_id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const unpaidBills = bills.filter(b => b.status === 'Unpaid');
  const unpaidCount = unpaidBills.length;
  
  const fin = calculateFinance(profile, config, bills);

  const handleToggleSelect = (billId) => {
    if (selectedBillIds.includes(billId)) {
      setSelectedBillIds(selectedBillIds.filter(id => id !== billId));
    } else {
      setSelectedBillIds([...selectedBillIds, billId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedBillIds.length === unpaidCount) {
      setSelectedBillIds([]); // deselect all
    } else {
      setSelectedBillIds(unpaidBills.map(b => b.id)); // select all unpaid
    }
  };

  const calculateSelectedTotal = () => {
    const selectedBills = bills.filter(b => selectedBillIds.includes(b.id));
    return selectedBills.reduce((sum, b) => sum + b.jumlah + (b.unique_code || 0), 0);
  };

  const handlePaySelected = () => {
    const totalAmount = calculateSelectedTotal();
    const combinedIds = selectedBillIds.join('_');
    
    if (config?.pakasir_slug) {
      // Use "M_" prefix to indicate multiple bills
      const orderId = `M_${combinedIds}`;
      const redirectUrl = window.location.href;
      const checkoutUrl = `https://app.pakasir.com/pay/${config.pakasir_slug}/${totalAmount}?order_id=${orderId}&qris_only=1&redirect=${encodeURIComponent(redirectUrl)}`;
      window.location.href = checkoutUrl;
    } else {
      // Manual multi-payment modal
      setSelectedBillDataForModal({
        isMulti: selectedBillIds.length > 1,
        jumlahTotal: totalAmount,
        ids: selectedBillIds
      });
      setIsDialogOpen(true);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `bukti-bayar/${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;

      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', fileName);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error || 'Gagal upload ke R2');

      setBuktiBayar(result.url);
    } catch (error) {
      alert("Gagal upload bukti ke R2: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleConfirmManualPayment = async () => {
    if (!selectedBillDataForModal || selectedBillDataForModal.ids.length === 0) return;
    
    try {
      setIsSubmitting(true);
      
      // Update all selected bills to Pending
      const promises = selectedBillDataForModal.ids.map(id => {
        return supabase
          .from('tagihan')
          .update({ 
            status: 'Pending',
            bukti_bayar: buktiBayar || null
          })
          .eq('id', id);
      });

      await Promise.all(promises);

      alert("Konfirmasi terkirim. Admin akan memverifikasi pembayaran Anda.");
      setIsDialogOpen(false);
      setBuktiBayar("");
      setSelectedBillIds([]); // Reset selection
      fetchData();
    } catch (error) {
      alert("Gagal konfirmasi: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-10 relative pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tagihan Saya</h1>
          <p className="text-slate-500 text-sm mt-1">Monitoring status iuran bulanan unit Anda</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Property Dimension</p>
            <Badge variant="indigo" className="text-sm px-6 py-2.5 font-black rounded-2xl shadow-xl shadow-indigo-500/10">{profile?.luas_tanah || 0} m²</Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="flex flex-col justify-center p-8 relative overflow-hidden group border-none shadow-2xl shadow-slate-200/50 hover:-translate-y-1 transition-all duration-500">
          <div className="space-y-1 relative z-10">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Total Kewajiban</p>
            <p className="text-3xl font-black text-slate-900 tracking-tighter">Rp {fin ? formatCurrency(fin.totalObligation) : '-'}</p>
            <p className="text-xs text-slate-500 font-medium mt-1">Sejak {fin ? formatDate(fin.tglSerahTerima) : '-'}</p>
          </div>
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-slate-100 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </Card>
        
        <Card className="flex flex-col justify-center p-8 relative overflow-hidden group border-none shadow-2xl shadow-slate-200/50 hover:-translate-y-1 transition-all duration-500">
          <div className="space-y-1 relative z-10">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Sudah Dibayar</p>
            <p className="text-3xl font-black text-emerald-500 tracking-tighter">Rp {fin ? formatCurrency(fin.totalPaid) : '-'}</p>
            <p className="text-xs text-slate-500 font-medium mt-1">{bills.filter(b => b.status === 'Paid').length} Bulan Lunas</p>
          </div>
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-emerald-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </Card>

        <Card className="flex flex-col justify-center p-8 relative overflow-hidden group border-none shadow-2xl shadow-indigo-100 hover:-translate-y-1 transition-all duration-500 bg-indigo-600 text-white">
          <div className="space-y-1 relative z-10">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Status Saldo</p>
            {fin?.kurang > 0 ? (
               <p className="text-3xl font-black text-rose-500 tracking-tighter uppercase">
                 Minus Rp {formatCurrency(fin.kurang)}
               </p>
            ) : fin?.lebih > 0 ? (
               <p className="text-3xl font-black text-blue-400 tracking-tighter uppercase">
                 Deposit Rp {formatCurrency(fin.lebih)}
               </p>
            ) : (
               <p className="text-3xl font-black text-emerald-400 tracking-tighter uppercase">LUNAS PAS</p>
            )}
            <p className="text-xs text-slate-400 font-medium mt-1">Rekapitulasi sisa kewajiban</p>
          </div>
          <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-indigo-500 rounded-full blur-3xl opacity-0 group-hover:opacity-30 transition-opacity"></div>
        </Card>
      </div>

      {/* Bank Account Info Card */}
      <div className="bg-indigo-50 p-8 rounded-2xl border border-indigo-100 flex flex-col lg:flex-row justify-between items-center gap-8 relative overflow-hidden group">
        <div className="absolute -left-10 -top-10 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-all duration-700"></div>
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-14 h-14 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
            <CreditCard className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-indigo-600/60 tracking-wider uppercase">Disbursement Channel</p>
            {config?.rekening_no ? (
              <>
                <p className="text-xl font-bold tracking-tight leading-none text-slate-900">{config.rekening_bank} • <span className="text-slate-500 font-mono tracking-normal">{config.rekening_no}</span></p>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">A/N {config.rekening_nama}</p>
              </>
            ) : (
              <p className="text-xl font-bold tracking-tight text-slate-900">Menunggu informasi dari Admin</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 relative z-10 w-full lg:w-auto">
          {config?.qris_url && (
            <div className="hidden lg:block p-3 bg-white rounded-lg shadow-xl shadow-slate-950/20">
              <img src={config.qris_url} alt="QRIS" className="w-16 h-16 object-contain" />
            </div>
          )}
          <Button variant="outline" size="md" icon={MessageCircleQuestion} className="flex-1 lg:flex-none bg-white text-slate-950 border-none hover:bg-slate-100 px-8 font-semibold">
            Bantuan Support
          </Button>
        </div>
      </div>

      <Card noPadding>
        <CardHeader title="Riwayat Tagihan" subtitle="Detail iuran bulanan Anda secara menyeluruh" />
        <Table>
          <THead>
            <TR isHeader>
              <TH className="w-12 text-center">
                {unpaidCount > 0 && (
                  <input 
                    type="checkbox" 
                    checked={selectedBillIds.length === unpaidCount} 
                    onChange={handleSelectAll} 
                    className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                  />
                )}
              </TH>
              <TH>Bulan Periode</TH>
              <TH>{bills.some(b => b.unique_code > 0) ? "Jumlah + Kode Unik" : "Jumlah Tagihan"}</TH>
              <TH>Total Transfer</TH>
              <TH>Status Pembayaran</TH>
            </TR>
          </THead>
          <TBody>
            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <TR key={i}><TD colSpan={6}><div className="h-16 bg-slate-50/50 rounded-2xl animate-pulse"></div></TD></TR>
              ))
            ) : bills.length === 0 ? (
              <TR>
                <TD colSpan={6} textAlign="center" className="py-24 text-[10px] font-bold tracking-[0.3em] text-slate-400 uppercase">Belum ada tagihan terbit.</TD>
              </TR>
            ) : bills.map((bill) => (
              <TR key={bill.id} className="group hover:bg-slate-50/50 transition-all">
                <TD className="text-center">
                  {bill.status === 'Unpaid' && (
                    <input 
                      type="checkbox" 
                      checked={selectedBillIds.length === unpaidCount} 
                      onChange={handleSelectAll} 
                      className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                    />
                  )}
                </TD>
                <TD className="text-sm font-semibold text-slate-900 tracking-tight">{months[bill.bulan-1]} {bill.tahun}</TD>
                <TD className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                  Rp {bill.jumlah.toLocaleString('id-ID')} {bill.unique_code > 0 && (
                    <>+ <span className="text-indigo-600 font-mono">{(bill.unique_code || 0).toString().padStart(3, '0')}</span></>
                  )}
                </TD>
                <TD className="text-sm font-semibold text-slate-950 tracking-tight">
                  Rp {(bill.jumlah + (bill.unique_code || 0)).toLocaleString('id-ID')}
                </TD>
                <TD>
                  <Badge variant={
                    bill.status === 'Paid' ? 'green' :
                    bill.status === 'Pending' ? 'orange' : 'rose'
                  }>
                    {bill.status === 'Paid' ? 'Lunas Terverifikasi' : bill.status === 'Pending' ? 'Dalam Antrian' : 'Belum Dibayar'}
                  </Badge>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>

      {/* Floating Action Bar for Multi-Select */}
      {selectedBillIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 backdrop-blur-xl text-white px-8 py-5 rounded-2xl shadow-2xl shadow-slate-950/20 flex items-center gap-8 z-50 animate-in slide-in-from-bottom-10 border border-white/5">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Total {selectedBillIds.length} Tagihan</span>
            <span className="text-2xl font-bold tracking-tight">Rp {calculateSelectedTotal().toLocaleString('id-ID')}</span>
          </div>
          <div className="w-px h-10 bg-white/10"></div>
          <Button 
            variant="primary" 
            onClick={handlePaySelected} 
            className="rounded-2xl px-10 py-5 font-black uppercase tracking-widest text-xs shadow-lg shadow-white/5"
          >
            Bayar Sekarang
          </Button>
        </div>
      )}

      <Modal
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title="Instruksi Pembayaran"
      >
        <div className="space-y-8 p-2">
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 flex gap-4 items-start">
            <div className="w-10 h-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center shrink-0 shadow-sm">
              <AlertCircle className="w-5 h-5 text-slate-900" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Protocol</h4>
              <p className="text-sm text-slate-900 font-bold leading-relaxed tracking-tight">
                {selectedBillDataForModal?.isMulti 
                  ? "Anda membayar beberapa bulan sekaligus. Silakan transfer tepat sesuai total tagihan gabungan di bawah ini."
                  : "Silakan transfer sesuai nominal yang tertera ke rekening di bawah ini."}
              </p>
            </div>
          </div>

          {selectedBillDataForModal && (
            <div className="space-y-8">
              <div className="text-center p-8 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 mb-2 tracking-wider uppercase">GRAND TOTAL TRANSFER</p>
                <div className="flex items-center justify-center gap-3">
                  <h2 className="text-4xl font-bold text-slate-950 tracking-tight">
                    Rp {selectedBillDataForModal.jumlahTotal.toLocaleString('id-ID')}
                  </h2>
                  <button onClick={() => copyToClipboard(selectedBillDataForModal.jumlahTotal)} className="p-2.5 bg-white hover:bg-slate-200 rounded-lg transition-all shadow-sm border border-slate-100">
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-300" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">BENEFICIARY BANK</p>
                  <p className="text-base font-bold text-slate-950 tracking-tight">{config?.rekening_bank || '-'}</p>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ACCOUNT NUMBER</p>
                  <p className="text-base font-bold text-slate-950 tracking-tight font-mono">{config?.rekening_no || '-'}</p>
                </div>
              </div>

              {config?.qris_url && (
                <div className="flex flex-col items-center gap-4 p-8 bg-white border border-slate-100 rounded-xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ALTERNATIVE: SCAN QRIS</p>
                  <div className="p-4 bg-slate-50 rounded-2xl">
                    <img src={config.qris_url} alt="QRIS" className="w-48 h-48 object-contain" />
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Upload Bukti Transfer (Opsional)</p>
                <div className="relative group">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    disabled={uploading}
                  />
                  <div className="p-8 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-3 bg-slate-50/30 group-hover:bg-slate-50 transition-all">
                    {uploading ? (
                      <p className="text-sm font-semibold text-slate-400 animate-pulse">Uploading...</p>
                    ) : buktiBayar ? (
                      <div className="relative">
                        <img src={buktiBayar} alt="Bukti" className="max-h-40 rounded-lg shadow-sm" />
                        <div className="absolute inset-0 bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <p className="text-white text-[10px] font-bold uppercase">Ganti Foto</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-slate-300 shadow-sm group-hover:scale-110 transition-transform border border-slate-100">
                          <Plus className="w-5 h-5" />
                        </div>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Klik atau tarik file ke sini</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 space-y-4">
                <Button 
                  variant="primary" 
                  className="w-full py-3.5 font-semibold"
                  isLoading={isSubmitting}
                  onClick={handleConfirmManualPayment}
                >
                  Saya Sudah Transfer Dana
                </Button>
                <p className="text-[9px] text-center text-slate-400 font-medium uppercase tracking-wider px-8 leading-relaxed">
                  Dengan mengklik tombol di atas, Anda menyatakan telah mengirim dana sesuai nominal yang tertera.
                </p>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
