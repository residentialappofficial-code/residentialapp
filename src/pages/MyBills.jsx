import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { ReceiptText, CheckCircle2, AlertCircle, CreditCard, ChevronRight, Copy, Check } from "lucide-react";
import { Button, Card, CardHeader, Table, THead, TBody, TR, TH, TD, Badge, Modal } from "@/components/ui";

export default function MyBills() {
 const { profile } = useAuth();
 const [bills, setBills] = useState([]);
 const [loading, setLoading] = useState(true);
 const [config, setConfig] = useState(null);
 const [selectedBill, setSelectedBill] = useState(null);
 const [isDialogOpen, setIsDialogOpen] = useState(false);
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [copied, setCopied] = useState(false);

 const months = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
 ];

 const fetchData = useCallback(async () => {
  try {
   setLoading(true);
   if (!profile?.id) return;
   
   // Fetch Config & Bills in parallel
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

 const handleConfirmPayment = async () => {
  if (!selectedBill) return;
  
  try {
   setIsSubmitting(true);
   const { error } = await supabase
    .from('tagihan')
    .update({ status: 'Pending' })
    .eq('id', selectedBill.id);

   if (error) throw error;

   alert("Konfirmasi terkirim. Admin akan memverifikasi pembayaran Anda.");
   setIsDialogOpen(false);
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
  <div className="max-w-full mx-auto flex flex-col gap-8">
   <div className="flex justify-between items-end">
    <div>
     <h1 className="text-xl font-bold text-slate-900 tracking-tight">Tagihan Saya</h1>
     <p className="text-slate-500 text-sm font-medium">Pantau status iuran bulanan Anda.</p>
    </div>
    <div className="text-right flex flex-col items-end gap-1">
     <p className="text-xs font-bold text-slate-400 ">Luas Tanah Anda</p>
     <Badge variant="slate" className="text-sm px-5 py-2.5">{profile?.luas_tanah || 0} m²</Badge>
    </div>
   </div>

   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <Card className="flex items-center gap-6 p-8 relative overflow-hidden group">
     <div className="w-10 h-10 bg-green-50 rounded-2xl flex items-center justify-center shadow-[0_1px_2px_rgba(0,0,0,0.03)] text-green-600 group-hover:scale-110 transition-transform">
      <CheckCircle2 className="w-5 h-5" />
     </div>
     <div className="space-y-1">
      <p className="text-xs font-bold text-slate-400 ">Status Saat Ini</p>
      <p className="text-2xl font-bold text-slate-900 tracking-tight">
       {bills.some(b => b.status === 'Unpaid') ? 'Ada Tunggakan' : 'Lancar'}
      </p>
     </div>
     <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-green-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
    </Card>

    <Card className="flex items-center gap-6 p-8 relative overflow-hidden group">
     <div className="w-10 h-10 bg-red-50 rounded-2xl flex items-center justify-center shadow-[0_1px_2px_rgba(0,0,0,0.03)] text-red-500 group-hover:scale-110 transition-transform">
      <ReceiptText className="w-5 h-5" />
     </div>
     <div className="space-y-1">
      <p className="text-xs font-bold text-slate-400 ">Tagihan Belum Bayar</p>
      <p className="text-2xl font-bold text-red-500 tracking-tight">
       {bills.filter(b => b.status === 'Unpaid').length} Bulan
      </p>
     </div>
     <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-red-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
    </Card>
   </div>

   {/* Bank Account Info Card */}
   <div className="bg-slate-950 p-8 rounded-2xl text-white shadow-none flex flex-col lg:flex-row justify-between items-center gap-8 relative overflow-hidden group">
    <div className="absolute -left-10 -top-6 w-48 h-48 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-all"></div>
    <div className="flex items-center gap-6 relative z-10">
     <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10 shadow-none">
      <CreditCard className="w-6 h-6" />
     </div>
     <div className="space-y-1">
      <p className="text-xs font-bold text-white/40 tracking-wider">TUJUAN PEMBAYARAN</p>
      {config?.rekening_no ? (
        <>
          <p className="text-xl font-bold tracking-tight">{config.rekening_bank}: <span className="text-white/60">{config.rekening_no}</span></p>
          <p className="text-xs font-bold text-white/50 ">A/N {config.rekening_nama}</p>
        </>
      ) : (
        <p className="text-xl font-bold tracking-tight">Menunggu informasi dari Admin</p>
      )}
     </div>
    </div>
    <div className="flex items-center gap-4 relative z-10 w-full lg:w-auto">
      {config?.qris_url && (
        <div className="hidden lg:block p-2 bg-white rounded-xl shadow-none">
          <img src={config.qris_url} alt="QRIS" className="w-16 h-16 object-contain" />
        </div>
      )}
     <Button variant="outline" className="flex-1 lg:flex-none bg-white text-slate-950 border-none hover:bg-slate-100 px-8 py-3 font-bold">
      Bantuan Admin
     </Button>
    </div>
   </div>

   <Card noPadding>
    <CardHeader title="Riwayat Tagihan" subtitle="Detail iuran bulanan Anda" />
    <Table>
     <THead>
      <TR isHeader>
       <TH>Bulan Periode</TH>
       <TH>Jumlah + Kode Unik</TH>
       <TH>Total Transfer</TH>
       <TH>Status Pembayaran</TH>
       <TH textAlign="right">Aksi</TH>
      </TR>
     </THead>
     <TBody>
      {loading ? (
       Array(3).fill(0).map((_, i) => (
        <TR key={i}><TD colSpan={5}><div className="h-5 bg-slate-50 rounded-lg animate-pulse"></div></TD></TR>
       ))
      ) : bills.length === 0 ? (
       <TR>
        <TD colSpan={5} textAlign="center" className="py-20 text-slate-400 font-bold text-xs">Belum ada tagihan terbit.</TD>
       </TR>
      ) : bills.map((bill) => (
       <TR key={bill.id}>
        <TD className="text-sm font-bold text-slate-900">{months[bill.bulan-1]} {bill.tahun}</TD>
        <TD className="text-sm font-bold text-slate-500">
          Rp {bill.jumlah.toLocaleString('id-ID')} + <span className="text-blue-600">{(bill.unique_code || 0).toString().padStart(3, '0')}</span>
        </TD>
        <TD className="text-sm font-bold text-slate-950 tracking-tight">
          Rp {(bill.jumlah + (bill.unique_code || 0)).toLocaleString('id-ID')}
        </TD>
        <TD>
         <Badge variant={
          bill.status === 'Paid' ? 'green' :
          bill.status === 'Pending' ? 'orange' : 'red'
         }>
          {bill.status === 'Paid' ? 'Lunas' : bill.status === 'Pending' ? 'Verifikasi' : 'Belum Bayar'}
         </Badge>
        </TD>
        <TD textAlign="right">
         {bill.status === 'Unpaid' ? (
          <Button 
           variant="primary" 
           size="sm" 
           onClick={() => {
            setSelectedBill(bill);
            setIsDialogOpen(true);
           }}
          >
           Bayar Sekarang
          </Button>
         ) : (
          <Button variant="ghost" size="sm" icon={ChevronRight} className="text-slate-300 pointer-events-none" />
         )}
        </TD>
       </TR>
      ))}
     </TBody>
    </Table>
   </Card>

   {/* Modal Konfirmasi Pembayaran */}
   <Modal
    isOpen={isDialogOpen}
    onClose={() => setIsDialogOpen(false)}
    title="Instruksi Pembayaran"
   >
    <div className="space-y-8">
     <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 flex gap-4">
      <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center shrink-0">
       <AlertCircle className="w-5 h-5 text-blue-600" />
      </div>
      <div className="space-y-1">
       <h4 className="text-xs font-bold text-blue-700 ">Info Penting</h4>
       <p className="text-xs text-blue-800 font-bold leading-relaxed">
        Mohon transfer tepat sampai 3 digit terakhir agar sistem dapat mendeteksi pembayaran Anda secara otomatis.
       </p>
      </div>
     </div>

     {selectedBill && (
      <div className="space-y-6">
        <div className="text-center p-8 bg-slate-50 rounded-2xl border border-slate-100">
          <p className="text-xs font-bold text-slate-400 mb-2 tracking-widest uppercase">TOTAL TRANSFER</p>
          <div className="flex items-center justify-center gap-3">
            <h2 className="text-4xl font-bold text-slate-950 tracking-tighter">
              Rp {(selectedBill.jumlah + (selectedBill.unique_code || 0)).toLocaleString('id-ID')}
            </h2>
            <button onClick={() => copyToClipboard(selectedBill.jumlah + (selectedBill.unique_code || 0))} className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
              {copied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5 text-slate-400" />}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 border border-slate-100 rounded-2xl space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase">BANK TUJUAN</p>
            <p className="text-sm font-bold text-slate-900">{config?.rekening_bank || '-'}</p>
          </div>
          <div className="p-6 border border-slate-100 rounded-2xl space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase">NOMOR REKENING</p>
            <p className="text-sm font-bold text-slate-900">{config?.rekening_no || '-'}</p>
          </div>
        </div>

        {config?.qris_url && (
          <div className="flex flex-col items-center gap-4 p-6 border border-slate-100 rounded-2xl bg-white">
            <p className="text-[10px] font-bold text-slate-400 uppercase">ATAU SCAN QRIS</p>
            <img src={config.qris_url} alt="QRIS" className="w-48 h-48 object-contain" />
          </div>
        )}

        <div className="pt-4 space-y-4">
          <Button 
            variant="primary" 
            className="w-full py-4 text-sm font-bold"
            isLoading={isSubmitting}
            onClick={handleConfirmPayment}
          >
            Saya Sudah Transfer
          </Button>
          <p className="text-[10px] text-center text-slate-400 font-medium">
            Dengan mengklik tombol di atas, Anda menyatakan telah mengirim dana sesuai nominal.
          </p>
        </div>
      </div>
     )}
    </div>
   </Modal>
  </div>
 );
}
