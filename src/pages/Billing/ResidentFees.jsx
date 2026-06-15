import { useState, useEffect, useCallback, useMemo } from "react";
import { Search, Calendar, Info, FileText, Building2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button, Input, Card, CardHeader, ConfirmModal } from "@/components/ui";
import { calculateFinance, formatCurrency } from "@/utils/financeUtils";
import { exportToPDF, exportToExcel } from "@/utils/exportUtils";

// Import modular sub-components
import ResidentFeesTable from "@/components/billing/ResidentFeesTable";
import ResidentFeesMobileList from "@/components/billing/ResidentFeesMobileList";
import ResidentBillsModal from "@/components/billing/ResidentBillsModal";

const monthsFull = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

export default function ResidentFees() {
  const { selectedPerumahanId, profile, perumahanList, switchPerumahan } = useAuth();
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

  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
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
  }, [warga]);

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

  const handleExportPDF = () => {
    if (filteredWarga.length === 0) return;
    const headers = ["Unit/Blok", "Nama Warga", "Kewajiban", "Sudah Dibayar", "Kurang", "Lebih"];
    const rows = filteredWarga.map(w => {
      const fin = calculateFinance(w, iuranConfig, allBills);
      return [
        w.blok,
        w.nama,
        `Rp ${formatCurrency(fin?.totalObligation || 0)}`,
        `Rp ${formatCurrency(fin?.totalPaid || 0)}`,
        `Rp ${formatCurrency(fin?.kurang || 0)}`,
        `Rp ${formatCurrency(fin?.lebih || 0)}`
      ];
    });
    exportToPDF("Rekap Keuangan Warga", headers, rows, `rekap_iuran_${selectedYear}.pdf`);
  };

  const handleExportExcel = () => {
    if (filteredWarga.length === 0) return;
    const exportData = filteredWarga.map(w => {
      const fin = calculateFinance(w, iuranConfig, allBills);
      return {
        "Unit/Blok": w.blok,
        "Nama Warga": w.nama,
        "Kewajiban (Rp)": fin?.totalObligation || 0,
        "Sudah Dibayar (Rp)": fin?.totalPaid || 0,
        "Kurang (Rp)": fin?.kurang || 0,
        "Lebih (Rp)": fin?.lebih || 0
      };
    });
    exportToExcel(exportData, `rekap_iuran_${selectedYear}.xlsx`);
  };

  return (
    <div className="flex flex-col gap-4 md:gap-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Monitoring Iuran</h1>
          <p className="text-slate-500 text-sm mt-1">Rekapitulasi kewajiban dan transparansi keuangan unit.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" icon={FileText} onClick={handleExportPDF}>PDF</Button>
            <Button variant="outline" size="sm" icon={FileText} onClick={handleExportExcel}>Excel</Button>
          </div>
          {profile?.role === 'super_admin' && (
            <div className="flex items-center bg-white border border-slate-200 rounded-lg px-4 py-2 gap-2 shadow-sm">
              <Building2 className="w-4 h-4 text-slate-400" />
              <select 
                value={selectedPerumahanId || ""} 
                onChange={(e) => switchPerumahan(e.target.value)}
                className="text-xs font-semibold text-slate-900 bg-transparent outline-none cursor-pointer"
              >
                <option value="" disabled>Pilih Perumahan</option>
                {perumahanList.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
              </select>
            </div>
          )}
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

        {/* Desktop Table Sub-Component */}
        <ResidentFeesTable 
          filteredWarga={filteredWarga}
          iuranConfig={iuranConfig}
          allBills={allBills}
          selectedYear={selectedYear}
          canEdit={canEdit}
          updatingId={updatingId}
          loading={loading}
          getMonthStatus={getMonthStatus}
          handleToggleStatus={handleToggleStatus}
          openWargaBills={openWargaBills}
          requestSort={requestSort}
          sortConfig={sortConfig}
        />

        {/* Mobile Grid List Sub-Component */}
        <ResidentFeesMobileList 
          filteredWarga={filteredWarga}
          iuranConfig={iuranConfig}
          allBills={allBills}
          selectedYear={selectedYear}
          canEdit={canEdit}
          updatingId={updatingId}
          handleToggleStatus={handleToggleStatus}
          openWargaBills={openWargaBills}
        />
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

      {/* Detail Invoices Modal */}
      <ResidentBillsModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedWarga={selectedWarga}
        allBills={allBills}
        updatingId={updatingId}
        handleToggleStatus={handleToggleStatus}
      />
      
      <ConfirmModal 
        {...confirmModal}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        loading={updatingId !== null}
      />
    </div>
  );
}
