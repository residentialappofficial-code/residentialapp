import { useState, useEffect, useCallback, useMemo } from "react";
import { Search, CheckCircle2, XCircle, Calendar, Info, ArrowUpRight, ArrowDownRight, Eye, ArrowUpDown } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button, Input, Card, CardHeader, Table, THead, TBody, TR, TH, TD, Badge, Modal, Select, ConfirmModal } from "@/components/ui";
import { calculateFinance, formatCurrency, formatDate } from "@/utils/financeUtils";

export const monthsFull = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

export default function ResidentFees() {
  const { selectedPerumahanId, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [warga, setWarga] = useState([]);
  const [allBills, setAllBills] = useState([]);
  const [iuranConfig, setIuranConfig] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: 'blok', direction: 'asc' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWarga, setSelectedWarga] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  // Confirm Modal State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "warning",
    onConfirm: () => {}
  });

  // RBAC: Hanya Admin atau Bendahara yang bisa edit status manual
  const canEdit = useMemo(() => {
    if (!profile) return false;
    const role = profile.role?.toLowerCase();
    const jabatan = profile.pengurus?.jabatan?.toLowerCase() || "";
    const pengurusRole = profile.pengurus?.role?.nama?.toLowerCase() || "";
    
    return role === 'admin' || 
           role === 'super_admin' || 
           jabatan.includes('bendahara') || 
           pengurusRole.includes('bendahara');
  }, [profile]);

  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    // Force start from 2023 as per user data
    let minYear = Math.min(2023, currentYear);
    
    warga.forEach(w => {
      const date = w.tgl_serah_terima || w.blok_info?.tgl_serah_terima;
      if (date) {
        const y = new Date(date).getFullYear();
        if (y && y < minYear) minYear = y;
      }
    });
    
    const years = [];
    for (let y = currentYear; y >= minYear; y--) {
      years.push(y);
    }
    return years;
  }, [warga, allBills]);

  const fetchData = useCallback(async () => {
    if (!selectedPerumahanId) return;
    try {
      setLoading(true);
      
      const [wargaRes, billsRes, configRes] = await Promise.all([
        supabase.from('warga').select('*, blok_info:blok_id(*)').eq('perumahan_id', selectedPerumahanId).eq('status_aktif', true).order('blok'),
        supabase.from('tagihan').select('*').eq('perumahan_id', selectedPerumahanId),
        supabase.from('iuran_config').select('*').eq('perumahan_id', selectedPerumahanId).maybeSingle()
      ]);

      if (wargaRes.error) throw wargaRes.error;
      if (billsRes.error) throw billsRes.error;

      setWarga(wargaRes.data || []);
      setAllBills(billsRes.data || []);
      setIuranConfig(configRes.data);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedPerumahanId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getMonthStatus = (wargaId, month, year) => {
    const bill = allBills.find(b => b.warga_id === wargaId && b.bulan === month && b.tahun === year);
    if (!bill) return 'None';
    return bill.status;
  };

  const filteredWarga = warga.filter(w => 
    w.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.blok.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    let aVal, bVal;
    
    if (['totalObligation', 'totalPaid', 'kurang', 'lebih'].includes(sortConfig.key)) {
      const finA = calculateFinance(a, iuranConfig, allBills);
      const finB = calculateFinance(b, iuranConfig, allBills);
      aVal = finA[sortConfig.key] || 0;
      bVal = finB[sortConfig.key] || 0;
    } else {
      aVal = a[sortConfig.key];
      bVal = b[sortConfig.key];
    }

    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleToggleStatus = (bill, wargaId = null, month = null, year = null) => {
    if (!canEdit) {
      alert("Hanya Admin atau Bendahara yang dapat mengubah status secara manual.");
      return;
    }

    if (!bill) {
      if (!wargaId || !month || !year) return;
      
      setConfirmModal({
        isOpen: true,
        title: "Konfirmasi Penerbitan Iuran",
        message: `Terbitkan dan tandai LUNAS iuran periode ${monthsFull[month - 1]} ${year} untuk unit ini?`,
        type: "info",
        onConfirm: () => executeToggleStatus(null, wargaId, month, year)
      });
      return;
    }

    const newStatus = bill.status === 'Paid' ? 'Unpaid' : 'Paid';
    setConfirmModal({
      isOpen: true,
      title: "Ubah Status Pembayaran",
      message: `Ubah status tagihan ${monthsFull[bill.bulan - 1]} ${bill.tahun} menjadi ${newStatus === 'Paid' ? 'LUNAS' : 'BELUM BAYAR'}?`,
      type: newStatus === 'Paid' ? "success" : "warning",
      onConfirm: () => executeToggleStatus(bill)
    });
  };

  const executeToggleStatus = async (bill, wargaId = null, month = null, year = null) => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
    
    // Jika bill belum ada (klik pada titik abu-abu)
    if (!bill) {
      const nominal = iuranConfig?.iuran_bulanan || iuranConfig?.tarif_dasar || 0;
      setUpdatingId(`new-${wargaId}-${month}`);
      
      try {
        const { data, error } = await supabase
          .from('tagihan')
          .insert({
            warga_id: wargaId,
            perumahan_id: selectedPerumahanId,
            bulan: month,
            tahun: year,
            jumlah: nominal,
            status: 'Paid',
            keterangan: 'Input Manual Bendahara'
          })
          .select()
          .single();

        if (error) throw error;
        setAllBills(prev => [...prev, data]);
      } catch (err) {
        alert("Gagal menerbitkan tagihan: " + err.message);
      } finally {
        setUpdatingId(null);
      }
      return;
    }

    // Jika bill sudah ada (fast toggle)
    const newStatus = bill.status === 'Paid' ? 'Unpaid' : 'Paid';
    setUpdatingId(bill.id);
    try {
      const { error } = await supabase
        .from('tagihan')
        .update({ status: newStatus })
        .eq('id', bill.id);

      if (error) throw error;

      setAllBills(prev => prev.map(b => b.id === bill.id ? { ...b, status: newStatus } : b));
    } catch (err) {
      alert("Gagal merubah status: " + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const openWargaBills = (w) => {
    setSelectedWarga(w);
    setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Monitoring Iuran</h1>
          <p className="text-slate-500 text-sm mt-1">Rekapitulasi kewajiban dan transparansi keuangan unit.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-white border border-slate-200 rounded-lg px-4 py-2 gap-2 shadow-sm">
            <Calendar className="w-4 h-4 text-slate-400" />
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="text-xs font-semibold text-slate-900 bg-transparent outline-none cursor-pointer"
            >
              {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
      </div>

      <Card noPadding>
        <CardHeader 
          title="Rekapitulasi Keuangan Warga"
          subtitle="Dihitung berdasarkan tanggal serah terima unit"
          action={
            <Input 
              placeholder="Cari nama atau blok..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={Search}
              className="w-80"
            />
          }
        />

        <div className="overflow-x-auto">
          <Table>
            <THead>
              <TR isHeader className="bg-slate-50/30">
                <TH 
                  className="sticky left-0 bg-white/80 backdrop-blur-md z-10 border-r border-slate-100 pl-6 text-[10px] font-bold uppercase tracking-widest text-slate-400 cursor-pointer hover:text-indigo-600 transition-colors w-40"
                  onClick={() => requestSort('blok')}
                >
                  <div className="flex items-center gap-2">
                    Unit / Nama
                    <ArrowUpDown size={10} className={sortConfig.key === 'blok' ? 'text-indigo-500' : 'text-slate-300'} />
                  </div>
                </TH>
                <TH className="text-[10px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap w-px">Tgl Serah Terima</TH>
                <TH 
                  textAlign="right" 
                  className="text-[10px] font-bold uppercase tracking-widest text-slate-400 cursor-pointer hover:text-indigo-600 transition-colors w-px whitespace-nowrap px-4"
                  onClick={() => requestSort('totalObligation')}
                >
                  <div className="flex items-center justify-end gap-2">
                    Kewajiban
                    <ArrowUpDown size={10} className={sortConfig.key === 'totalObligation' ? 'text-indigo-500' : 'text-slate-300'} />
                  </div>
                </TH>
                <TH 
                  textAlign="right" 
                  className="text-[10px] font-bold uppercase tracking-widest text-slate-400 cursor-pointer hover:text-indigo-600 transition-colors w-px whitespace-nowrap px-4"
                  onClick={() => requestSort('totalPaid')}
                >
                  <div className="flex items-center justify-end gap-2">
                    Sudah Dibayar
                    <ArrowUpDown size={10} className={sortConfig.key === 'totalPaid' ? 'text-indigo-500' : 'text-slate-300'} />
                  </div>
                </TH>
                <TH 
                  textAlign="right" 
                  className="text-[10px] font-bold uppercase tracking-widest text-slate-400 cursor-pointer hover:text-indigo-600 transition-colors w-px whitespace-nowrap px-4"
                  onClick={() => requestSort('kurang')}
                >
                  <div className="flex items-center justify-end gap-2">
                    Kurang
                    <ArrowUpDown size={10} className={sortConfig.key === 'kurang' ? 'text-indigo-500' : 'text-slate-300'} />
                  </div>
                </TH>
                <TH 
                  textAlign="right" 
                  className="text-[10px] font-bold uppercase tracking-widest text-slate-400 cursor-pointer hover:text-indigo-600 transition-colors w-px whitespace-nowrap px-4"
                  onClick={() => requestSort('lebih')}
                >
                  <div className="flex items-center justify-end gap-2">
                    Lebih
                    <ArrowUpDown size={10} className={sortConfig.key === 'lebih' ? 'text-indigo-500' : 'text-slate-300'} />
                  </div>
                </TH>
                {months.map(m => (
                  <TH key={m} textAlign="center" className="text-[9px] font-black uppercase text-slate-400 w-8 px-0 border-l border-slate-50">{m}</TH>
                ))}
              </TR>
            </THead>
            <TBody>
              {loading ? (
                Array(6).fill(0).map((_, i) => (
                  <TR key={i}><TD colSpan={18}><div className="h-16 bg-slate-50/50 rounded-2xl animate-pulse"></div></TD></TR>
                ))
              ) : filteredWarga.length === 0 ? (
                <TR><TD colSpan={18} textAlign="center" className="py-24 text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em]">Data warga tidak ditemukan</TD></TR>
              ) : filteredWarga.map((w) => {
                const fin = calculateFinance(w, iuranConfig, allBills);
                return (
                  <TR key={w.id} className="group hover:bg-slate-50/50 transition-all text-[11px]">
                    <TD className="sticky left-0 bg-white group-hover:bg-slate-50/50 z-10 border-r border-slate-100 transition-colors py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900 tracking-tight">{w.blok}</span>
                        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider truncate w-32">{w.nama}</span>
                      </div>
                    </TD>
                    <TD className="text-xs font-medium text-slate-600 whitespace-nowrap w-px">
                      {fin ? formatDate(fin.tglSerahTerima) : "-"}
                    </TD>
                    <TD textAlign="right" className="font-bold text-slate-900 whitespace-nowrap w-px px-4">
                      {fin ? `Rp ${formatCurrency(fin.totalObligation)}` : "-"}
                    </TD>
                    <TD textAlign="right" className="font-bold text-green-600 whitespace-nowrap w-px px-4">
                      {fin ? `Rp ${formatCurrency(fin.totalPaid)}` : "-"}
                    </TD>
                    <TD textAlign="right" className="w-px whitespace-nowrap px-4">
                      {fin?.kurang > 0 ? (
                        <span className="inline-flex items-center gap-1 text-red-600 font-bold">
                          <ArrowDownRight size={12} />
                          Rp {formatCurrency(fin.kurang)}
                        </span>
                      ) : <span className="text-slate-300">-</span>}
                    </TD>
                    <TD textAlign="right" className="w-px whitespace-nowrap px-4">
                      {fin?.lebih > 0 ? (
                        <span className="inline-flex items-center gap-1 text-blue-600 font-bold">
                          <ArrowUpRight size={12} />
                          Rp {formatCurrency(fin.lebih)}
                        </span>
                      ) : <span className="text-slate-300">-</span>}
                    </TD>
                    {months.map((_, i) => {
                      const status = getMonthStatus(w.id, i + 1, selectedYear);
                      const bill = allBills.find(b => b.warga_id === w.id && b.bulan === (i + 1) && b.tahun === selectedYear);
                      const isGray = !fin || status === 'None';
                      
                      return (
                        <TD key={i} textAlign="center" className="px-0 border-l border-slate-50/50">
                          {isGray ? (
                            <button 
                              onClick={() => handleToggleStatus(null, w.id, i + 1, selectedYear)}
                              disabled={!canEdit || updatingId === `new-${w.id}-${i+1}`}
                              className={`group flex items-center justify-center w-full h-10 transition-all ${canEdit ? 'cursor-pointer hover:bg-slate-50/50' : 'cursor-default'}`}
                              title={canEdit ? `Klik untuk tandai LUNAS ${monthsFull[i]} ${selectedYear}` : "Belum mulai iuran"}
                            >
                              <div className={`rounded-full transition-all ${
                                canEdit 
                                  ? 'w-4 h-4 border-2 border-dashed border-slate-200 group-hover:border-indigo-400 group-hover:bg-indigo-50 flex items-center justify-center' 
                                  : 'w-1.5 h-1.5 bg-slate-100'
                              }`}>
                                {canEdit && <span className="text-[10px] text-slate-300 group-hover:text-indigo-500 font-bold">+</span>}
                              </div>
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleToggleStatus(bill)}
                              disabled={!canEdit || updatingId === bill?.id}
                              className={`w-5 h-5 rounded-full flex items-center justify-center mx-auto transition-all ${
                                status === 'Paid' 
                                  ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20 scale-110' 
                                  : 'bg-rose-500 shadow-lg shadow-rose-500/20'
                              } ${(!canEdit || updatingId === bill?.id) ? 'opacity-50' : 'hover:scale-125'} ${canEdit ? 'cursor-pointer' : 'cursor-default'}`}
                              title={status === 'Paid' ? 'Lunas' : 'Belum Bayar'}
                            >
                              {status === 'Paid' ? <CheckCircle2 size={10} className="text-white" /> : <XCircle size={10} className="text-white" />}
                            </button>
                          )}
                        </TD>
                      );
                    })}
                  </TR>
                );
              })}
            </TBody>
          </Table>
        </div>
      </Card>

      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex items-start gap-4">
        <Info className="text-indigo-600 w-5 h-5 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-bold text-slate-900">Tentang Kalkulasi Iuran</p>
          <p className="text-xs text-slate-500 leading-relaxed font-medium">
            Total kewajiban dihitung secara otomatis mulai dari tanggal serah terima unit hingga bulan berjalan ({new Date().toLocaleString('id-ID', { month: 'long', year: 'numeric' })}). 
            Data pembayaran mencakup seluruh transaksi yang telah diverifikasi oleh pengurus.
          </p>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedWarga ? `Detail Tagihan: ${selectedWarga.nama} (${selectedWarga.blok})` : "Detail Tagihan"}
        size="lg"
      >
        <div className="p-4">
          <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            {selectedWarga && (
              <div className="space-y-3">
                {allBills
                  .filter(b => b.warga_id === selectedWarga.id)
                  .sort((a, b) => {
                    if (a.tahun !== b.tahun) return b.tahun - a.tahun;
                    return b.bulan - a.bulan;
                  })
                  .map(bill => (
                    <div key={bill.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-slate-100/50 transition-colors">
                      <div>
                        <p className="text-sm font-bold text-slate-900">Periode {monthsFull[bill.bulan - 1]} {bill.tahun}</p>
                        <p className="text-xs font-medium text-slate-500 mt-0.5">Rp {formatCurrency(bill.jumlah)}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant={bill.status === 'Paid' ? 'green' : 'indigo'}>
                          {bill.status === 'Paid' ? 'Lunas' : 'Belum Bayar'}
                        </Badge>
                        <Button 
                          variant={bill.status === 'Paid' ? 'outline' : 'primary'}
                          size="sm"
                          isLoading={updatingId === bill.id}
                          onClick={() => handleToggleStatus(bill)}
                          className={bill.status === 'Paid' ? 'text-slate-600 border-slate-200 hover:bg-slate-100' : ''}
                        >
                          {bill.status === 'Paid' ? 'Batalkan' : 'Tandai Lunas'}
                        </Button>
                      </div>
                    </div>
                  ))}
                  {allBills.filter(b => b.warga_id === selectedWarga.id).length === 0 && (
                    <div className="text-center py-10 text-slate-400 text-sm font-medium">Belum ada riwayat tagihan tercatat.</div>
                  )}
              </div>
            )}
          </div>
        </div>
      </Modal>
      
      <ConfirmModal 
        {...confirmModal}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        loading={updatingId !== null}
      />
    </div>
  );
}
