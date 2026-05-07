import { useState, useEffect, useCallback } from "react";
import { Search, CheckCircle2, XCircle, User, Info, AlertCircle, Copy, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button, Input, Card, CardHeader, Table, THead, TBody, TR, TH, TD, Badge } from "@/components/ui";

export default function VerifyPayments() {
  const { selectedPerumahanId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedId, setCopiedId] = useState(null);

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
        .order("created_at", { ascending: false });

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
    const confirmMsg = newStatus === 'Paid' 
      ? "Konfirmasi pembayaran ini sebagai LUNAS? Tindakan ini akan memperbarui status tagihan warga dan mencatatnya di Arus Kas."
      : "Tolak konfirmasi ini? Warga harus melakukan konfirmasi ulang.";
      
    if (!window.confirm(confirmMsg)) return;
    
    try {
      const { error } = await supabase
        .from("tagihan")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;

      // Jika diverivikasi Lunas, otomatis masuk ke Arus Kas
      if (newStatus === 'Paid') {
        const bill = data.find(b => b.id === id);
        if (bill) {
          const { error: kasError } = await supabase.from('arus_kas').insert([{
            perumahan_id: selectedPerumahanId,
            tanggal: new Date().toISOString().split('T')[0],
            keterangan: `Pembayaran Iuran: ${bill.warga?.nama || 'Warga'} (${bill.bulan}/${bill.tahun})`,
            jumlah: bill.jumlah + (bill.unique_code || 0),
            kategori: 'Pemasukan'
          }]);
          
          if (kasError) console.error("Gagal mencatat arus kas:", kasError);
        }
      }

      fetchPendingPayments();
    } catch (err) {
      alert("Gagal memproses verifikasi: " + err.message);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredData = data.filter(item => 
    item.warga?.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.warga?.blok?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Verifikasi Pembayaran</h1>
          <p className="text-slate-500 text-sm font-medium">Validasi konfirmasi transfer warga berdasarkan kode unik.</p>
        </div>
      </div>

      <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 flex gap-4 items-center">
        <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center shrink-0">
          <Info className="w-5 h-5 text-blue-600" />
        </div>
        <p className="text-xs text-blue-800 font-bold leading-relaxed">
          Sistem menggunakan metode **Kode Unik**. Cukup cocokan nominal total di mutasi rekening Anda dengan daftar di bawah. Tidak perlu cek bukti transfer manual.
        </p>
      </div>

      <Card noPadding>
        <CardHeader 
          title="Antrian Verifikasi" 
          subtitle="Daftar warga yang telah melakukan konfirmasi transfer"
          action={
            <Input 
              placeholder="Cari warga atau blok..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={Search}
              className="w-80"
            />
          }
        />

        <Table>
          <THead>
            <TR isHeader>
              <TH>Warga & Unit</TH>
              <TH>Periode</TH>
              <TH textAlign="right">Kode Unik</TH>
              <TH textAlign="right">Total Transfer</TH>
              <TH textAlign="right">Aksi Verifikasi</TH>
            </TR>
          </THead>
          <TBody>
            {loading ? (
              Array(4).fill(0).map((_, i) => (
                <TR key={i}><TD colSpan={5}><div className="h-12 bg-slate-50 rounded-xl animate-pulse"></div></TD></TR>
              ))
            ) : filteredData.length === 0 ? (
              <TR><TD colSpan={5} textAlign="center" className="py-24 text-xs font-bold tracking-[0.3em] text-slate-400">Antrian kosong. Tidak ada verifikasi pending.</TD></TR>
            ) : filteredData.map((item) => (
              <TR key={item.id} className="group">
                <TD>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center shadow-[0_1px_2px_rgba(0,0,0,0.03)] text-white group-hover:scale-110 transition-transform">
                      {item.warga?.nama?.charAt(0)}
                    </div>
                    <div className="flex flex-col">
                      <p className="text-sm font-bold text-slate-900 tracking-tight">{item.warga?.nama}</p>
                      <p className="text-xs font-bold text-slate-400 ">{item.warga?.blok}</p>
                    </div>
                  </div>
                </TD>
                <TD className="text-slate-500 font-bold text-xs uppercase">
                  {item.bulan}/{item.tahun}
                </TD>
                <TD textAlign="right">
                  <Badge variant="slate" className="font-mono text-blue-600 px-3">
                    {(item.unique_code || 0).toString().padStart(3, '0')}
                  </Badge>
                </TD>
                <TD textAlign="right">
                  <div className="flex items-center justify-end gap-2 group/total">
                    <span className="text-sm font-bold text-slate-950 tracking-tight">
                      Rp {(item.jumlah + (item.unique_code || 0)).toLocaleString('id-ID')}
                    </span>
                    <button 
                      type="button"
                      onClick={() => copyToClipboard(item.jumlah + (item.unique_code || 0), item.id)}
                      className="p-1.5 opacity-0 group-hover/total:opacity-100 hover:bg-slate-100 rounded-lg transition-all"
                    >
                      {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                    </button>
                  </div>
                </TD>
                <TD textAlign="right">
                  <div className="flex justify-end gap-3">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      icon={XCircle} 
                      className="text-slate-400 hover:text-red-500 hover:bg-red-50" 
                      onClick={() => handleAction(item.id, 'Unpaid')}
                    />
                    <Button 
                      variant="primary" 
                      size="sm" 
                      icon={CheckCircle2} 
                      className="px-6 rounded-xl shadow-none"
                      onClick={() => handleAction(item.id, 'Paid')}
                    >
                      Verifikasi Lunas
                    </Button>
                  </div>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>

      <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 flex gap-4 items-center">
        <div className="w-10 h-10 bg-amber-100 rounded-2xl flex items-center justify-center shrink-0">
          <AlertCircle className="w-5 h-5 text-amber-600" />
        </div>
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-amber-700 uppercase tracking-widest">PENTING</h4>
          <p className="text-xs text-amber-800 font-bold leading-relaxed">
            Pastikan dana sudah benar-benar masuk ke rekening sebelum melakukan verifikasi Lunas. Verifikasi tidak dapat dibatalkan melalui UI.
          </p>
        </div>
      </div>
    </div>
  );
}
