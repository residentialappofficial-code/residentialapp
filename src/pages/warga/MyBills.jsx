import { useState, useEffect, useMemo, useCallback } from "react";
import { 
  ReceiptText, 
  Calendar, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  History,
  Info,
  CreditCard,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button, Card, CardHeader, Badge, Modal, Input, Table, THead, TBody, TR, TH, TD } from "@/components/ui";

export default function MyBills() {
  const { profile } = useAuth();
  const [tagihan, setTagihan] = useState([]);
  const [iuranConfig, setIuranConfig] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [payMonth, setPayMonth] = useState(new Date().getMonth() + 1);
  const [payYear, setPayYear] = useState(new Date().getFullYear());
  const [amount, setAmount] = useState("");

  const fetchData = useCallback(async () => {
    if (!profile?.perumahan_id || !profile?.warga_id) return;
    
    try {
      setLoading(true);
      const [configRes, billsRes] = await Promise.all([
        supabase.from('iuran_config').select('*').eq('perumahan_id', profile.perumahan_id).maybeSingle(),
        supabase.from('tagihan').select('*').eq('warga_id', profile.warga_id).order('tahun', { ascending: false }).order('bulan', { ascending: false })
      ]);
      
      setIuranConfig(configRes.data);
      setTagihan(billsRes.data || []);
      
      if (configRes.data) {
        setAmount(configRes.data.tarif_dasar?.toString() || "");
      }
    } catch (error) {
      console.error("Error fetching bills:", error);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const stats = useMemo(() => {
    if (!profile || !iuranConfig) return null;
    const tglSerahTerima = new Date(profile.tgl_serah_terima || profile.created_at);
    const now = new Date();
    const months = (now.getFullYear() - tglSerahTerima.getFullYear()) * 12 + (now.getMonth() - tglSerahTerima.getMonth()) + 1;
    const totalObligation = Math.max(0, months) * (iuranConfig.tarif_dasar || 0);
    const totalPaid = tagihan.filter(b => b.status === 'Paid').reduce((sum, b) => sum + Number(b.jumlah), 0);
    const diff = totalPaid - totalObligation;

    return {
      tglSerahTerima, months, totalObligation, totalPaid, diff,
      isUnderpaid: diff < 0, isOverpaid: diff > 0
    };
  }, [profile, tagihan, iuranConfig]);

  const handlePay = async () => {
    if (!amount) {
      alert("Jumlah harus diisi");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('tagihan')
        .insert([{
          perumahan_id: profile.perumahan_id,
          warga_id: profile.warga_id,
          bulan: parseInt(payMonth),
          tahun: parseInt(payYear),
          jumlah: parseInt(amount),
          status: 'Pending',
          keterangan: 'Pembayaran via Dashboard Warga'
        }]);

      if (error) throw error;

      alert("Konfirmasi pembayaran terkirim. Menunggu verifikasi admin.");
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      alert("Error: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };


  return (
    <div className="flex flex-col gap-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tagihan & Keuangan</h1>
          <p className="text-slate-500 text-sm mt-1">Ringkasan kewajiban dan riwayat pembayaran Anda</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" icon={History} onClick={() => window.print()}>Unduh Rekap (PDF)</Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-400">Tgl Serah Terima</p>
            <h2 className="text-xl font-bold text-slate-900">
              {stats ? new Date(stats.tglSerahTerima).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : "-"}
            </h2>
            <div className="flex items-center gap-1.5 text-indigo-600 font-medium text-xs">
              <Calendar size={14} /> {stats?.months} Bulan
            </div>
          </div>
        </Card>

        <Card>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-400">Total Kewajiban</p>
            <h2 className="text-xl font-bold text-slate-900">
              {stats ? formatCurrency(stats.totalObligation) : "-"}
            </h2>
            <p className="text-xs font-medium text-slate-400">Hingga bulan ini</p>
          </div>
        </Card>

        <Card>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-400">Sudah Dibayar</p>
            <h2 className="text-xl font-bold text-emerald-600">
              {stats ? formatCurrency(stats.totalPaid) : "-"}
            </h2>
            <div className="flex items-center gap-1.5 text-emerald-500 font-medium text-xs">
              <CheckCircle2 size={14} /> Terkonfirmasi
            </div>
          </div>
        </Card>

        <Card>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-400">
              {stats?.isUnderpaid ? "Kurang Bayar" : stats?.isOverpaid ? "Lebih Bayar" : "Status Saldo"}
            </p>
            <h2 className={`text-xl font-bold ${stats?.isUnderpaid ? "text-rose-600" : stats?.isOverpaid ? "text-blue-600" : "text-slate-600"}`}>
              {stats ? formatCurrency(Math.abs(stats.diff)) : "-"}
            </h2>
            <div className={`flex items-center gap-1.5 font-medium text-xs ${stats?.isUnderpaid ? "text-rose-500" : "text-blue-500"}`}>
              {stats?.isUnderpaid ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
              {stats?.isUnderpaid ? "Tunggakan" : "Saldo Lebih"}
            </div>
          </div>
        </Card>
      </div>

      {/* List Tagihan */}
      <Card noPadding>
        <CardHeader 
          title="Riwayat Pembayaran" 
          subtitle="Catatan transaksi iuran bulanan"
          action={
            <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>Bayar Iuran</Button>
          }
        />
        <div className="overflow-x-auto">
          <Table>
            <THead>
              <TR isHeader>
                <TH>Bulan/Tahun</TH>
                <TH>Jumlah</TH>
                <TH>Status</TH>
                <TH>Tgl Konfirmasi</TH>
                <TH>Keterangan</TH>
              </TR>
            </THead>
            <TBody>
              {loading ? (
                Array(3).fill(0).map((_, i) => <TR key={i}><TD colSpan={5}><div className="h-12 bg-slate-50 animate-pulse rounded-xl"></div></TD></TR>)
              ) : tagihan.length === 0 ? (
                <TR><TD colSpan={5} textAlign="center" className="py-12 text-slate-400 font-bold text-[10px] uppercase tracking-widest">Belum ada catatan pembayaran</TD></TR>
              ) : tagihan.map((b) => (
                <TR key={b.id}>
                  <TD className="font-bold text-slate-900">
                    {new Date(b.tahun, b.bulan - 1).toLocaleString('id-ID', { month: 'long', year: 'numeric' })}
                  </TD>
                  <TD className="font-medium">{formatCurrency(b.jumlah)}</TD>
                  <TD>
                    <Badge variant={b.status === 'Paid' ? 'green' : b.status === 'Pending' ? 'indigo' : 'rose'}>
                      {b.status === 'Paid' ? 'Lunas' : b.status === 'Pending' ? 'Menunggu' : 'Gagal'}
                    </Badge>
                  </TD>
                  <TD className="text-slate-500">
                    {b.created_at ? new Date(b.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }) : "-"}
                  </TD>
                  <TD className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{b.keterangan || "-"}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
      </Card>

      {/* Payment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Konfirmasi Pembayaran"
      >
        <div className="space-y-8 p-2">
          {/* Bank Info */}
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center shadow-sm">
                <CreditCard className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Transfer Bank</p>
                <p className="text-sm font-bold text-slate-900 tracking-tight">{iuranConfig?.rekening_bank || "Bank Mandiri"}</p>
              </div>
            </div>
            
            <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Nomor Rekening</p>
                <p className="text-base font-bold text-slate-900 tracking-widest">{iuranConfig?.rekening_no || "123-456-7890"}</p>
              </div>
              <Button 
                variant="outline"
                size="xs"
                onClick={() => {
                  navigator.clipboard.writeText(iuranConfig?.rekening_no || "123-456-7890");
                  alert("Nomor rekening disalin!");
                }}
              >
                Salin
              </Button>
            </div>
            <p className="text-xs font-semibold text-slate-500">Atas Nama: <span className="text-slate-900">{iuranConfig?.rekening_nama || "Pengurus HABITIX"}</span></p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Bulan</label>
              <Input type="number" min="1" max="12" value={payMonth} onChange={(e) => setPayMonth(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Tahun</label>
              <Input type="number" value={payYear} onChange={(e) => setPayYear(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Jumlah Pembayaran (Rp)</label>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>

          <div className="p-5 bg-orange-50 rounded-3xl border border-orange-100 flex items-start gap-4">
            <Info className="text-orange-600 w-5 h-5 shrink-0 mt-1" />
            <p className="text-xs text-orange-800 font-medium leading-relaxed">
              Silakan transfer sesuai jumlah di atas, lalu kirimkan konfirmasi ini. Admin akan memverifikasi pembayaran Anda dalam 1x24 jam.
            </p>
          </div>

          <div className="flex gap-4 pt-4">
            <Button variant="outline" className="flex-1 py-4" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button 
              variant="primary" 
              className="flex-1 py-4" 
              isLoading={isSubmitting}
              onClick={handlePay}
            >
              Kirim Konfirmasi
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
