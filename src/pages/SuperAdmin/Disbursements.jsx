import { useState, useEffect, useCallback } from "react";
import { Wallet, Landmark, Receipt, Sparkles, Send, CheckCircle2, History, AlertCircle, RefreshCw, Calendar, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Card, CardHeader, Table, THead, TBody, TR, TH, TD, Badge, Button, Input, Modal, StatCard } from "@/components/ui";

export default function Disbursements() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalCollected: 0, totalHeld: 0, totalPlatformFee: 0, totalDisbursed: 0 });
  const [complexes, setComplexes] = useState([]);
  const [history, setHistory] = useState([]);
  
  // Payout Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedComplex, setSelectedComplex] = useState(null);
  const [adminFeeInput, setAdminFeeInput] = useState("5000"); // Default payout admin fee Rp 5.000
  const [refNoInput, setRefNoInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // 1. Fetch tagihan with perumahan info
      const { data: tagihan, error: tagihanError } = await supabase
        .from('tagihan')
        .select('*, perumahan:perumahan_id(nama)');
      
      if (tagihanError) throw tagihanError;

      // 2. Fetch disbursements list
      const { data: disbs, error: disbsError } = await supabase
        .from('disbursements')
        .select('*, perumahan:perumahan_id(nama)')
        .order('created_at', { ascending: false });
        
      if (disbsError) throw disbsError;
      setHistory(disbs || []);

      // 3. Fetch iuran configs to get bank info of complexes
      const { data: configs, error: configsError } = await supabase
        .from('iuran_config')
        .select('*, perumahan:perumahan_id(nama)');
      if (configsError) throw configsError;

      // Calculate aggregates
      let totalCollected = 0;
      let totalHeld = 0;
      let totalDisbursed = disbs?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;
      let totalPlatformFee = disbs?.reduce((sum, d) => sum + Number(d.admin_fee), 0) || 0;

      // Group tagihan by perumahan_id
      const complexMap = {};
      configs?.forEach(cfg => {
        complexMap[cfg.perumahan_id] = {
          id: cfg.perumahan_id,
          nama: cfg.perumahan?.nama || "Unknown Complex",
          bankName: cfg.rekening_bank || "-",
          bankNo: cfg.rekening_no || "-",
          bankOwner: cfg.rekening_nama || "-",
          collected: 0,
          held: 0
        };
      });

      tagihan?.forEach(t => {
        if (t.status === 'Paid') {
          totalCollected += Number(t.jumlah);
          
          if (!t.disbursement_id) {
            totalHeld += Number(t.jumlah);
            
            // Add to complex balance
            if (complexMap[t.perumahan_id]) {
              complexMap[t.perumahan_id].held += Number(t.jumlah);
            }
          }
          
          if (complexMap[t.perumahan_id]) {
            complexMap[t.perumahan_id].collected += Number(t.jumlah);
          }
        }
      });

      setStats({
        totalCollected,
        totalHeld,
        totalPlatformFee,
        totalDisbursed
      });

      setComplexes(Object.values(complexMap));
    } catch (err) {
      console.error("Gagal memuat rekap pencairan:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenPayout = (complex) => {
    setSelectedComplex(complex);
    setRefNoInput("");
    setIsModalOpen(true);
  };

  const handleProcessPayout = async () => {
    if (!refNoInput) {
      alert("Masukkan nomor referensi transfer bank!");
      return;
    }
    const adminFee = parseInt(adminFeeInput) || 0;
    if (adminFee > selectedComplex.held) {
      alert("Biaya admin tidak boleh melebihi total dana tertahan!");
      return;
    }

    setIsSubmitting(true);
    try {
      const netAmount = selectedComplex.held - adminFee;

      // 1. Insert into disbursements
      const { data: disbRecord, error: disbError } = await supabase
        .from('disbursements')
        .insert([{
          perumahan_id: selectedComplex.id,
          amount: netAmount,
          admin_fee: adminFee,
          status: 'Disbursed',
          reference_no: refNoInput,
          disbursed_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (disbError) throw disbError;

      // 2. Link paid tagihan for this complex to the disbursement
      const { error: updateError } = await supabase
        .from('tagihan')
        .update({ disbursement_id: disbRecord.id })
        .eq('perumahan_id', selectedComplex.id)
        .eq('status', 'Paid')
        .is('disbursement_id', null);

      if (updateError) throw updateError;

      // 3. Log an automatic disbursement fee in the complex's cash flow
      const { error: kasError } = await supabase.from('arus_kas').insert([{
        perumahan_id: selectedComplex.id,
        tanggal: new Date().toISOString().split('T')[0],
        keterangan: `Pencairan Dana (Disbursement): Bersih Rp ${netAmount.toLocaleString('id-ID')} (Potongan Biaya Admin Platform Rp ${adminFee.toLocaleString('id-ID')})`,
        jumlah: adminFee,
        kategori: 'Pengeluaran'
      }]);

      if (kasError) console.error("Gagal mencatat pencairan di arus kas tenant:", kasError);

      alert("Pencairan dana sukses dicatat!");
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      alert("Gagal memproses pencairan: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (val) => {
    return `Rp ${(val || 0).toLocaleString('id-ID')}`;
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Landmark className="w-6 h-6 text-indigo-600" /> Pencairan Dana Tenant (Multi-Tenant QRIS)
          </h1>
          <p className="text-slate-500 text-sm mt-1">Kelola pencairan dana terkumpul dari QRIS ke rekening pengurus masing-masing perumahan.</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} icon={RefreshCw}>Refresh</Button>
      </div>

      {/* Finance Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Total Dana Masuk" value={formatCurrency(stats.totalCollected)} icon={Wallet} isPositive={true} change="Total QRIS Terbayar" />
        <StatCard title="Dana Tertahan" value={formatCurrency(stats.totalHeld)} icon={AlertCircle} isPositive={false} change="Belum Didisburse" />
        <StatCard title="Pendapatan Admin Platform" value={formatCurrency(stats.totalPlatformFee)} icon={Receipt} isPositive={true} change="Platform Fee Payout" />
        <StatCard title="Dana Terdistribusi" value={formatCurrency(stats.totalDisbursed)} icon={CheckCircle2} isPositive={true} change="Sudah Ditransfer" />
      </div>

      {/* Complexes Balances */}
      <Card noPadding>
        <CardHeader 
          title="Saldo Kas Perumahan" 
          subtitle="Daftar saldo dana terkumpul per tenant yang siap dicarikan ke bank pengurus"
        />
        <Table>
          <THead>
            <TR isHeader>
              <TH>Perumahan</TH>
              <TH>Detail Rekening Pengurus</TH>
              <TH textAlign="right">Total Terkumpul</TH>
              <TH textAlign="right">Saldo Tertahan</TH>
              <TH textAlign="right">Aksi</TH>
            </TR>
          </THead>
          <TBody>
            {loading ? (
              <TR><TD colSpan={5} className="text-center py-8 text-slate-400">Memuat saldo...</TD></TR>
            ) : complexes.length === 0 ? (
              <TR><TD colSpan={5} className="text-center py-8 text-slate-400">Belum ada perumahan yang terkonfigurasi.</TD></TR>
            ) : complexes.map(item => (
              <TR key={item.id}>
                <TD className="font-bold text-slate-900">{item.nama}</TD>
                <TD>
                  <div className="flex flex-col text-xs text-slate-600 gap-0.5">
                    <span className="font-bold text-slate-800">{item.bankName}</span>
                    <span>No. Rek: <span className="font-bold">{item.bankNo}</span></span>
                    <span>A/N: {item.bankOwner}</span>
                  </div>
                </TD>
                <TD textAlign="right" className="font-semibold text-slate-600">
                  {formatCurrency(item.collected)}
                </TD>
                <TD textAlign="right" className="font-bold text-amber-600">
                  {formatCurrency(item.held)}
                </TD>
                <TD textAlign="right">
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={item.held <= 0}
                    onClick={() => handleOpenPayout(item)}
                    icon={Send}
                  >
                    Disburse Dana
                  </Button>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>

      {/* Payout History */}
      <Card noPadding>
        <CardHeader 
          title="Riwayat Pencairan Dana" 
          subtitle="Log logistik pengiriman dana bersih ke bank pengurus perumahan"
        />
        <Table>
          <THead>
            <TR isHeader>
              <TH>Waktu Pencairan</TH>
              <TH>Perumahan</TH>
              <TH textAlign="right">Jumlah Bersih</TH>
              <TH textAlign="right">Biaya Admin</TH>
              <TH>No. Referensi Bank</TH>
              <TH>Status</TH>
            </TR>
          </THead>
          <TBody>
            {loading ? (
              <TR><TD colSpan={6} className="text-center py-8 text-slate-400">Memuat riwayat...</TD></TR>
            ) : history.length === 0 ? (
              <TR><TD colSpan={6} className="text-center py-8 text-slate-400">Belum ada riwayat pencairan dana.</TD></TR>
            ) : history.map(item => (
              <TR key={item.id}>
                <TD className="text-xs text-slate-500">
                  {new Date(item.disbursed_at || item.created_at).toLocaleString('id-ID')}
                </TD>
                <TD className="font-semibold text-slate-850">{item.perumahan?.nama || "Unknown"}</TD>
                <TD textAlign="right" className="font-bold text-emerald-600">
                  {formatCurrency(item.amount)}
                </TD>
                <TD textAlign="right" className="text-slate-500 font-semibold">
                  {formatCurrency(item.admin_fee)}
                </TD>
                <TD className="text-xs text-slate-600 font-mono tracking-wider font-bold">
                  {item.reference_no}
                </TD>
                <TD>
                  <Badge variant="green">SUKSES</Badge>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>

      {/* Payout Modal */}
      {selectedComplex && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={`Pencairan Dana: ${selectedComplex.nama}`}
        >
          <div className="space-y-6 p-2">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bank Tujuan Transfer</p>
              <p className="text-sm font-black text-slate-850 mt-1">{selectedComplex.bankName} - {selectedComplex.bankNo}</p>
              <p className="text-xs text-slate-500 mt-0.5">A/N: {selectedComplex.bankOwner}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
              <div>
                <p className="text-slate-400">Dana Terkumpul:</p>
                <p className="text-lg font-bold text-slate-900 mt-1">{formatCurrency(selectedComplex.held)}</p>
              </div>
              <div>
                <p className="text-slate-400">Jumlah Transfer Bersih:</p>
                <p className="text-lg font-bold text-indigo-600 mt-1">
                  {formatCurrency(selectedComplex.held - (parseInt(adminFeeInput) || 0))}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Potongan Biaya Admin Platform (Rp)</label>
              <Input 
                type="number" 
                value={adminFeeInput} 
                onChange={(e) => setAdminFeeInput(e.target.value)} 
                placeholder="5000"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Nomor Referensi Transfer Bank (Wajib)</label>
              <Input 
                type="text" 
                value={refNoInput} 
                onChange={(e) => setRefNoInput(e.target.value)} 
                placeholder="REF-XXXXX-XXXXX"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>Batal</Button>
              <Button 
                variant="primary" 
                className="flex-1"
                isLoading={isSubmitting}
                onClick={handleProcessPayout}
              >
                Konfirmasi Transfer
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
