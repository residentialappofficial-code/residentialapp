import { useState, useEffect, useCallback } from "react";
import { Search, CheckCircle2, XCircle, Clock, Download, Calendar, ArrowUpRight, CreditCard, Banknote } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button, Input, Card, CardHeader, Table, THead, TBody, TR, TH, TD, Badge, Select, StatCard } from "@/components/ui";
import { SelectionRequired } from "@/components/ui/SelectionRequired";



export default function PembayaranIuran() {
  const { profile, selectedPerumahanId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [warga, setWarga] = useState([]);
  const [bills, setBills] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState("");

  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  const fetchData = useCallback(async () => {
    if (!selectedPerumahanId) return;
    try {
      setLoading(true);
      
      const [wargaRes, billsRes] = await Promise.all([
        supabase.from('warga').select('id, nama, blok').eq('perumahan_id', selectedPerumahanId).eq('status_aktif', true).order('blok'),
        supabase.from('tagihan').select('warga_id, status, bulan, tahun, jumlah').eq('perumahan_id', selectedPerumahanId).eq('tahun', selectedYear)
      ]);

      if (wargaRes.error) throw wargaRes.error;
      if (billsRes.error) throw billsRes.error;

      setWarga(wargaRes.data || []);
      setBills(billsRes.data || []);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedPerumahanId, selectedYear]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getStatus = (wargaId, month) => {
    const bill = bills.find(b => b.warga_id === wargaId && b.bulan === month);
    if (!bill) return 'None';
    return bill.status;
  };

  const filteredWarga = warga.filter(w => 
    w.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.blok.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalCollected = bills.filter(b => b.status === 'Paid').reduce((acc, curr) => acc + curr.jumlah, 0);
  const pendingCount = bills.filter(b => b.status === 'Pending').length;
  const collectionRate = bills.length > 0 ? Math.round((bills.filter(b => b.status === 'Paid').length / bills.length) * 100) : 0;

  if (profile?.role === 'super_admin' && !selectedPerumahanId) {
    return <SelectionRequired />;
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Monitoring Iuran</h1>
          <p className="text-slate-500 text-sm mt-1">Pantau status pelunasan iuran seluruh warga dalam satu tampilan komprehensif.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white border border-slate-200 rounded-lg px-4 py-2 gap-2 shadow-sm">
            <Calendar className="w-4 h-4 text-slate-400" />
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="text-xs font-semibold text-slate-900 bg-transparent outline-none cursor-pointer"
            >
              {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <Button variant="ghost" icon={Download} size="sm" className="text-slate-500 font-semibold hover:bg-slate-50">Export Report</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <StatCard title="Total Iuran Terkumpul" value={`Rp ${totalCollected.toLocaleString()}`} icon={Banknote} isPositive={true} change="Sudah Verifikasi" />
        <StatCard title="Collection Efficiency" value={`${collectionRate}%`} icon={ArrowUpRight} isPositive={collectionRate > 70} change="Rate Pelunasan" />
        <StatCard title="Verifikasi Antrian" value={`${pendingCount} Unit`} icon={Clock} isPositive={pendingCount === 0} change="Perlu Audit" />
      </div>

      <Card noPadding>
        <CardHeader 
          title={`Status Pelunasan Global - ${selectedYear}`}
          subtitle="Gunakan tabel audit ini untuk sinkronisasi bulanan seluruh unit hunian"
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

        <div className="overflow-x-auto scrollbar-hide">
          <Table>
            <THead>
              <TR isHeader>
                <TH className="sticky left-0 bg-white z-10 border-r border-slate-100 min-w-[200px]">Warga / Unit Identitas</TH>
                {months.map((m) => (
                  <TH key={m} textAlign="center" className="min-w-[80px] text-[10px] uppercase tracking-wider">{m.substring(0, 3)}</TH>
                ))}
              </TR>
            </THead>
            <TBody>
              {loading ? (
                Array(6).fill(0).map((_, i) => (
                  <TR key={i}><TD colSpan={14}><div className="h-16 bg-slate-50/50 rounded-2xl animate-pulse"></div></TD></TR>
                ))
              ) : filteredWarga.length === 0 ? (
                <TR><TD colSpan={14} textAlign="center" className="py-32 text-[10px] font-bold tracking-[0.3em] text-slate-400 uppercase">Data warga tidak ditemukan</TD></TR>
              ) : filteredWarga.map((w) => (
                <TR key={w.id} className="group hover:bg-slate-50/50 transition-all">
                  <TD className="sticky left-0 bg-white group-hover:bg-slate-50/50 z-10 border-r border-slate-100 transition-colors">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-900 tracking-tight mb-0.5">{w.nama}</span>
                      <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{w.blok}</span>
                    </div>
                  </TD>
                  {months.map((_, i) => {
                    const status = getStatus(w.id, i + 1);
                    return (
                      <TD key={i} textAlign="center">
                        <div className="flex justify-center">
                          {status === 'Paid' ? (
                            <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shadow-sm shadow-emerald-600/5 transition-transform group-hover:scale-110">
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                          ) : status === 'Pending' ? (
                            <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center animate-pulse shadow-sm shadow-amber-600/5">
                              <Clock className="w-4 h-4" />
                            </div>
                          ) : status === 'Unpaid' ? (
                            <div className="w-8 h-8 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center shadow-sm shadow-rose-500/5 transition-transform group-hover:scale-110">
                              <XCircle className="w-4 h-4" />
                            </div>
                          ) : (
                            <div className="w-1.5 h-1.5 bg-slate-100 rounded-full"></div>
                          )}
                        </div>
                      </TD>
                    );
                  })}
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
