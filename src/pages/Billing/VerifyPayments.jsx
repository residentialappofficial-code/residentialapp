import { useState, useEffect, useCallback } from "react";
import { Search, CheckCircle2, XCircle, User, Info, AlertCircle, Copy, Check, Eye } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button, Input, Card, CardHeader, Table, THead, TBody, TR, TH, TD, Badge, Modal } from "@/components/ui";

export default function VerifyPayments() {
  const { selectedPerumahanId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [selectedProof, setSelectedProof] = useState(null);

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
    <div className="flex flex-col gap-4 md:gap-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Verifikasi Pembayaran</h1>
          <p className="text-slate-500 text-sm mt-1">Validasi konfirmasi transfer unit warga secara manual atau otomatis.</p>
        </div>
      </div>

      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col md:flex-row gap-5 items-start md:items-center relative overflow-hidden group">
        <div className="w-12 h-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center shrink-0 shadow-sm relative z-10">
          <Info className="w-6 h-6 text-indigo-600" />
        </div>
        <div className="space-y-1 relative z-10">
          <h4 className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Protokol Verifikasi Antrian</h4>
          <p className="text-sm text-slate-600 font-semibold leading-relaxed tracking-tight">
            {data.some(b => b.unique_code > 0) 
              ? "Sistem mendeteksi penggunaan Kode Unik. Cukup validasi nominal total pada mutasi rekening Anda dengan daftar antrian di bawah."
              : "Lakukan validasi manual berdasarkan nominal transfer yang masuk ke rekening operasional perumahan."}
          </p>
        </div>
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
              className="w-96"
            />
          }
        />

        <Table>
          <THead>
            <TR isHeader>
              <TH>Warga & Unit</TH>
              <TH>Periode</TH>
              <TH textAlign="right">{data.some(b => b.unique_code > 0) ? "Kode Unik" : "Potongan"}</TH>
              <TH textAlign="right">Total Transfer</TH>
              <TH textAlign="right">Aksi Verifikasi</TH>
            </TR>
          </THead>
          <TBody>
            {loading ? (
              Array(4).fill(0).map((_, i) => (
                <TR key={i}><TD colSpan={5}><div className="h-16 bg-slate-50/50 rounded-2xl animate-pulse"></div></TD></TR>
              ))
            ) : filteredData.length === 0 ? (
              <TR><TD colSpan={5} textAlign="center" className="py-32 text-[10px] font-bold tracking-[0.3em] text-slate-400 uppercase">Antrian kosong. Tidak ada verifikasi pending.</TD></TR>
            ) : filteredData.map((item) => (
              <TR key={item.id} className="group">
                <TD>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center text-slate-600 font-bold text-xs shadow-sm">
                      {item.warga?.nama?.charAt(0)}
                    </div>
                    <div className="flex flex-col">
                      <p className="text-sm font-bold text-slate-900 tracking-tight">{item.warga?.nama}</p>
                      <p className="text-[10px] font-medium text-slate-400 mt-0.5 uppercase tracking-wider">{item.warga?.blok}</p>
                    </div>
                  </div>
                </TD>
                <TD className="text-xs font-medium text-slate-500">
                  {item.bulan}/{item.tahun}
                </TD>
                <TD textAlign="right">
                  <Badge variant="indigo" className="font-mono">
                    {(item.unique_code || 0).toString().padStart(3, '0')}
                  </Badge>
                </TD>
                <TD textAlign="right">
                  <div className="flex items-center justify-end gap-2 group/total">
                    <span className="text-sm font-bold text-slate-900 tracking-tight">
                      Rp {(item.jumlah + (item.unique_code || 0)).toLocaleString('id-ID')}
                    </span>
                    <button 
                      type="button"
                      onClick={() => copyToClipboard(item.jumlah + (item.unique_code || 0), item.id)}
                      className="p-1.5 opacity-0 group-hover/total:opacity-100 hover:bg-slate-100 rounded-lg transition-all"
                    >
                      {copiedId === item.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                    </button>
                  </div>
                </TD>
                <TD textAlign="right">
                  <div className="flex justify-end gap-1">
                    {item.bukti_bayar && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        icon={Eye} 
                        className="text-blue-500 hover:bg-blue-50" 
                        onClick={() => setSelectedProof(item.bukti_bayar)}
                      />
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      icon={XCircle} 
                      className="text-slate-300 hover:text-red-500 hover:bg-red-50" 
                      onClick={() => handleAction(item.id, 'Unpaid')}
                    />
                    <Button 
                      variant="primary" 
                      size="sm" 
                      icon={CheckCircle2} 
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

      <div className="bg-amber-50 p-6 rounded-xl border border-amber-100 flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
          <AlertCircle className="w-5 h-5 text-amber-600" />
        </div>
        <div className="space-y-1">
          <h4 className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Perhatian Khusus</h4>
          <p className="text-sm text-amber-800 font-semibold leading-relaxed tracking-tight">
            Pastikan dana sudah benar-benar masuk ke rekening sebelum melakukan verifikasi Lunas. Verifikasi tidak dapat dibatalkan melalui UI.
          </p>
        </div>
      </div>
      <Modal
        isOpen={!!selectedProof}
        onClose={() => setSelectedProof(null)}
        title="Bukti Transfer Warga"
      >
        <div className="flex justify-center p-2">
          <img 
            src={selectedProof} 
            alt="Bukti Transfer" 
            className="max-w-full rounded-2xl shadow-lg border border-slate-100" 
          />
        </div>
        <div className="mt-6 flex justify-center">
          <Button variant="ghost" onClick={() => setSelectedProof(null)} className="font-semibold">Tutup Preview</Button>
        </div>
      </Modal>
    </div>
  );
}
