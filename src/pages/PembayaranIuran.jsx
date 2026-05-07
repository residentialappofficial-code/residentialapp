import { useState, useEffect, useCallback } from "react";
import { Search, CheckCircle2, XCircle, Clock, Download, Calendar, ArrowUpRight, CreditCard, Banknote } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button, Input, Card, CardHeader, Table, THead, TBody, TR, TH, TD, Badge } from "@/components/ui";
import { SelectionRequired } from "@/components/ui/SelectionRequired";

const BillingStatCard = ({ title, value, icon: Icon, type = "neutral" }) => {
  const styles = {
    neutral: "bg-slate-950 text-white border border-slate-900 shadow-none",
    success: "bg-green-50 text-green-600 border border-green-100 shadow-none",
    blue: "bg-blue-50 text-blue-600 border border-blue-100 shadow-none",
    amber: "bg-amber-50 text-amber-600 border border-amber-100 shadow-none",
  };

  return (
    <Card className="relative overflow-hidden group">
      <div className="flex flex-col gap-8">
        <div className="flex justify-between items-start">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-[0_1px_2px_rgba(0,0,0,0.03)] ${styles[type]}  transition-transform group-hover:scale-110 duration-300`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
        
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-slate-900 tracking-tighter">{value}</h3>
          <p className="text-xs font-bold text-slate-400">{title}</p>
        </div>
      </div>
      <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-slate-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
    </Card>
  );
};

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
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Monitoring Iuran</h1>
          <p className="text-slate-500 text-sm font-medium">Pantau status pelunasan iuran seluruh warga dalam satu tampilan.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white border border-slate-100 rounded-xl px-4 py-2 gap-3 shadow-none">
            <Calendar className="w-4 h-4 text-slate-400" />
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="text-sm font-bold text-slate-900 bg-transparent outline-none cursor-pointer"
            >
              {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <Button variant="ghost" icon={Download} className="text-slate-400 font-bold">Export Report</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <BillingStatCard title="Total Iuran Masuk" value={`Rp ${totalCollected.toLocaleString()}`} icon={Banknote} type="success" />
        <BillingStatCard title="Tingkat Penagihan" value={`${collectionRate}%`} icon={ArrowUpRight} type="blue" />
        <BillingStatCard title="Menunggu Verifikasi" value={`${pendingCount} Unit`} icon={Clock} type="amber" />
      </div>

      <Card noPadding>
        <CardHeader 
          title={`Status Pelunasan - ${selectedYear}`}
          subtitle="Gunakan tabel ini untuk audit bulanan warga"
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
              <TR isHeader>
                <TH className="sticky left-0 bg-white z-10 border-r border-slate-50 min-w-[200px]">Warga / Unit</TH>
                {months.map((m, i) => (
                  <TH key={m} textAlign="center" className="min-w-[80px] text-[10px] uppercase tracking-widest">{m.substring(0, 3)}</TH>
                ))}
              </TR>
            </THead>
            <TBody>
              {loading ? (
                Array(6).fill(0).map((_, i) => (
                  <TR key={i}><TD colSpan={14}><div className="h-10 bg-slate-50 rounded-lg animate-pulse"></div></TD></TR>
                ))
              ) : filteredWarga.length === 0 ? (
                <TR><TD colSpan={14} textAlign="center" className="py-24 text-slate-400 font-bold text-xs">Data warga tidak ditemukan</TD></TR>
              ) : filteredWarga.map((w) => (
                <TR key={w.id} className="group hover:bg-slate-50/50">
                  <TD className="sticky left-0 bg-white group-hover:bg-slate-50/50 z-10 border-r border-slate-50">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900 tracking-tight">{w.nama}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{w.blok}</span>
                    </div>
                  </TD>
                  {months.map((_, i) => {
                    const status = getStatus(w.id, i + 1);
                    return (
                      <TD key={i} textAlign="center">
                        {status === 'Paid' ? (
                          <div className="flex justify-center">
                            <div className="w-6 h-6 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </div>
                          </div>
                        ) : status === 'Pending' ? (
                          <div className="flex justify-center">
                            <div className="w-6 h-6 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center animate-pulse">
                              <Clock className="w-3.5 h-3.5" />
                            </div>
                          </div>
                        ) : status === 'Unpaid' ? (
                          <div className="flex justify-center">
                            <div className="w-6 h-6 bg-red-50 text-red-500 rounded-lg flex items-center justify-center">
                              <XCircle className="w-3.5 h-3.5" />
                            </div>
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-100">-</span>
                        )}
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
