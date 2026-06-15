import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { 
  Users, 
  ArrowUpRight,
  Activity,
  CircleDollarSign,
  TrendingDown,
  AlertCircle,
  Calendar,
  Layers,
  Wallet,
  MoreHorizontal,
  ChevronRight,
  Building2,
  Receipt,
  RefreshCw
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button, Card, CardHeader, StatCard, Table, THead, TBody, TR, TH, TD, Badge } from "@/components/ui";
import { SelectionRequired } from "@/components/ui/SelectionRequired";
import DashboardWarga from "@/pages/warga/Dashboard";

// Minimalist local helpers for trends
const Sparkline = ({ color }) => (
  <svg width="60" height="30" viewBox="0 0 60 30">
    <path d="M0 25 L10 20 L20 22 L30 10 L40 15 L50 5 L60 0" fill="none" stroke={color} strokeWidth="2" />
  </svg>
);

export default function Dashboard() {
  const { selectedPerumahanId, profile } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentPayments, setRecentPayments] = useState([]);
  const [chartData, setChartData] = useState({ data: [], labels: [], max: 1 });
  const [topTunggakan, setTopTunggakan] = useState([]);

  // Super Admin Stats States
  const [superStats, setSuperStats] = useState(null);
  const [superComplexes, setSuperComplexes] = useState([]);

  const fetchSuperAdminData = useCallback(async () => {
    try {
      setLoading(true);
      const [perumahanRes, wargaRes, tagihanRes, disbRes] = await Promise.all([
        supabase.from('perumahan').select('id, nama, created_at'),
        supabase.from('warga').select('id, perumahan_id'),
        supabase.from('tagihan').select('jumlah, status, perumahan_id, disbursement_id'),
        supabase.from('disbursements').select('*')
      ]);

      if (perumahanRes.error) throw perumahanRes.error;

      const totalPerumahan = perumahanRes.data?.length || 0;
      const totalWarga = wargaRes.data?.length || 0;
      
      const paidBills = tagihanRes.data?.filter(t => t.status === 'Paid') || [];
      const totalVolume = paidBills.reduce((sum, t) => sum + Number(t.jumlah), 0);
      const totalPlatformFee = disbRes.data?.reduce((sum, d) => sum + Number(d.admin_fee), 0) || 0;
      const totalDisbursed = disbRes.data?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;
      const totalHeld = paidBills.filter(t => !t.disbursement_id).reduce((sum, t) => sum + Number(t.jumlah), 0);

      // Aggregate statistics per perumahan
      const complexStatsMap = {};
      perumahanRes.data?.forEach(p => {
        complexStatsMap[p.id] = {
          id: p.id,
          nama: p.nama,
          createdAt: p.created_at,
          wargaCount: 0,
          totalCollected: 0,
          payoutCount: 0
        };
      });

      wargaRes.data?.forEach(w => {
        if (complexStatsMap[w.perumahan_id]) {
          complexStatsMap[w.perumahan_id].wargaCount += 1;
        }
      });

      paidBills.forEach(t => {
        if (complexStatsMap[t.perumahan_id]) {
          complexStatsMap[t.perumahan_id].totalCollected += Number(t.jumlah);
        }
      });

      disbRes.data?.forEach(d => {
        if (complexStatsMap[d.perumahan_id]) {
          complexStatsMap[d.perumahan_id].payoutCount += 1;
        }
      });

      setSuperStats({
        totalPerumahan,
        totalWarga,
        totalVolume,
        totalPlatformFee,
        totalDisbursed,
        totalHeld
      });
      setSuperComplexes(Object.values(complexStatsMap));
    } catch (err) {
      console.error("Gagal memuat statistik Super Admin:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDashboardData = useCallback(async () => {
    if (!selectedPerumahanId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      const [wargaRes, tagihanRes, recentRes, rpcRes] = await Promise.all([
        supabase.from("warga").select("id", { count: "exact" }).eq("perumahan_id", selectedPerumahanId).eq("status_aktif", true),
        supabase.from("tagihan")
          .select("jumlah, status")
          .eq("perumahan_id", selectedPerumahanId)
          .eq("bulan", currentMonth)
          .eq("tahun", currentYear),
        supabase.from("tagihan")
          .select(`
            id, jumlah, created_at,
            warga:warga_id(nama, blok)
          `)
          .eq("perumahan_id", selectedPerumahanId)
          .eq("status", "Paid")
          .order("created_at", { ascending: false })
          .limit(5),
        supabase.rpc('get_dashboard_stats', { p_perumahan_id: selectedPerumahanId })
      ]);

      const iuranBulanIni = tagihanRes.data
        ?.filter(d => d.status === 'Paid')
        .reduce((acc, curr) => acc + (parseInt(curr.jumlah) || 0), 0) || 0;

      const totalWarga = wargaRes.count || 0;
      const sudahBayar = tagihanRes.data?.filter(d => d.status === 'Paid').length || 0;
      const ratePembayaran = totalWarga > 0 ? (sudahBayar / totalWarga) * 100 : 0;

      const rpcData = rpcRes.data || {};
      
      // Chart Data processing from RPC
      const labels = [];
      const cData = [];
      const d = new Date();
      d.setDate(1); 
      for (let i = 5; i >= 0; i--) {
        const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
        labels.push(m.toLocaleString('id-ID', { month: 'short' }));
        
        // Find matching data from RPC
        const monthData = rpcData.kas_bulanan?.find(k => k.month === m.getMonth() && k.year === m.getFullYear());
        
        cData.push({ 
          month: m.getMonth(), 
          year: m.getFullYear(), 
          pemasukan: monthData ? parseInt(monthData.pemasukan) || 0 : 0, 
          pengeluaran: monthData ? parseInt(monthData.pengeluaran) || 0 : 0 
        });
      }

      const maxVal = Math.max(...cData.map(c => Math.max(c.pemasukan, c.pengeluaran)), 1);
      setChartData({ data: cData, labels, max: maxVal });

      // Tunggakan Processing from RPC
      setTopTunggakan(rpcData.top_tunggakan || []);

      setStats({
        totalWarga,
        iuranBulanIni,
        ratePembayaran,
        saldoKas: parseInt(rpcData.saldo_kas) || 0,
        totalPengeluaran: parseInt(rpcData.pengeluaran) || 0,
        totalTunggakan: parseInt(rpcData.total_tunggakan) || 0
      });
      setRecentPayments(recentRes.data || []);
    } catch (err) {
      console.error("Error fetching dashboard stats:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedPerumahanId]);

  useEffect(() => {
    if (profile?.role === 'super_admin' && !selectedPerumahanId) {
      fetchSuperAdminData();
    } else {
      fetchDashboardData();
    }
  }, [selectedPerumahanId, profile, fetchSuperAdminData, fetchDashboardData]);

  if (profile?.role === 'super_admin' && !selectedPerumahanId) {
    return (
      <div className="flex flex-col gap-6 max-w-full mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-2">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Layers className="w-6 h-6 text-indigo-600" /> Konsol Super Admin
            </h1>
            <p className="text-slate-500 text-sm mt-1">Ikhtisar metrik skala platform, performa tenant, dan log finansial</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchSuperAdminData} icon={RefreshCw}>Refresh</Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            Array(4).fill(0).map((_, i) => (
              <Card key={i} className="h-32 bg-white animate-pulse" />
            ))
          ) : (
            <>
              <StatCard title="Total Komplek (Tenant)" value={superStats?.totalPerumahan?.toString()} change="Perumahan Terdaftar" icon={Building2} />
              <StatCard title="Total Warga Terdaftar" value={superStats?.totalWarga?.toString()} change="Seluruh Komplek" icon={Users} />
              <StatCard title="Volume QRIS Platform" value={`Rp ${(superStats?.totalVolume || 0).toLocaleString('id-ID')}`} change="Kumulatif Pembayaran" icon={Wallet} />
              <StatCard title="Komisi Platform" value={`Rp ${(superStats?.totalPlatformFee || 0).toLocaleString('id-ID')}`} change="Dihitung dari Pencairan" icon={Receipt} />
            </>
          )}
        </div>

        {/* Info Box */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1 flex flex-col justify-between p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Dana Platform</p>
                <Badge variant="green">Held Funds</Badge>
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">
                Rp {(superStats?.totalHeld || 0).toLocaleString('id-ID')}
              </p>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Total dana pembayaran iuran warga yang saat ini masih ditampung di rekening utama gateway Pakasir dan belum dicairkan ke bank pengurus perumahan.
              </p>
            </div>
            <Link to="/super-admin/disbursements" className="mt-6">
              <Button variant="indigo" className="w-full text-xs" iconRight={ChevronRight}>Kelola Pencairan Dana</Button>
            </Link>
          </Card>

          {/* Complexes Performance list */}
          <Card className="lg:col-span-2 noPadding">
            <CardHeader title="Performa Tenant Perumahan" subtitle="Statistik aktivitas transaksi QRIS dan jumlah warga per tenant" />
            <Table>
              <THead>
                <TR isHeader>
                  <TH>Nama Perumahan</TH>
                  <TH>Terdaftar</TH>
                  <TH textAlign="right">Warga</TH>
                  <TH textAlign="right">Total Transaksi</TH>
                  <TH textAlign="right">Status Pencairan</TH>
                </TR>
              </THead>
              <TBody>
                {loading ? (
                  <TR><TD colSpan={5} className="text-center py-6 text-slate-400">Memuat data...</TD></TR>
                ) : superComplexes.length === 0 ? (
                  <TR><TD colSpan={5} className="text-center py-6 text-slate-400">Belum ada tenant terdaftar.</TD></TR>
                ) : superComplexes.map(item => (
                  <TR key={item.id}>
                    <TD className="font-bold text-slate-900">{item.nama}</TD>
                    <TD className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleDateString('id-ID')}</TD>
                    <TD textAlign="right" className="font-semibold">{item.wargaCount} Jiwa</TD>
                    <TD textAlign="right" className="font-bold text-indigo-600">Rp {item.totalCollected.toLocaleString('id-ID')}</TD>
                    <TD textAlign="right">
                      <Badge variant={item.payoutCount > 0 ? 'green' : 'amber'}>
                        {item.payoutCount > 0 ? `${item.payoutCount} Payouts` : 'Belum Pernah'}
                      </Badge>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </Card>
        </div>
      </div>
    );
  }

  if (profile?.role === 'warga') {
    return <DashboardWarga />;
  }

  return (
    <div className="flex flex-col gap-6 max-w-full mx-auto">
      {/* Header */}
      <div className="flex justify-between items-end mb-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-slate-500 text-sm mt-1">Data intelligence powered by HABITIX Operating System</p>
        </div>
      </div>

      {/* Top Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <Card key={i} className="h-32 bg-white animate-pulse" />
          ))
        ) : (
          <>
            <StatCard 
              title="Saldo Bersih Kas" 
              value={`Rp ${(stats?.saldoKas || 0).toLocaleString()}`} 
              change="+ Likuiditas Aman" 
              trend={<Sparkline color="#10B981" />}
            />
            <StatCard 
              title="Iuran Bulan Ini" 
              value={`Rp ${(stats?.iuranBulanIni || 0).toLocaleString()}`} 
              change="+ Target Bulanan" 
              trend={<Sparkline color="#10B981" />}
            />
            <StatCard 
              title="Total Warga" 
              value={stats?.totalWarga?.toString()} 
              change="Terverifikasi" 
              isCircle 
            />
            <StatCard 
              title="Laju Pembayaran" 
              gaugeValue={(stats?.ratePembayaran || 0).toFixed(0)} 
              status={stats?.ratePembayaran > 50 ? "Optimal" : "Kurang"} 
              isPositive={stats?.ratePembayaran > 50}
            />
          </>
        )}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-8">
          <Card className="h-full flex flex-col">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-8">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                    <CircleDollarSign className="w-4 h-4 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Kas / Pendapatan</h3>
                    <p className="text-xs text-slate-500">Performa Arus Kas</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-1 overflow-x-auto scrollbar-hide py-1">
                {['1m', '5m', '15m', '1h', '4h', '1D'].map(t => (
                  <Button 
                    key={t} 
                    variant={t === '1D' ? 'indigo' : 'ghost'} 
                    size="xs"
                    className={t === '1D' ? '' : 'text-slate-400'}
                  >
                    {t}
                  </Button>
                ))}
              </div>
            </div>

            {/* Minimalist Chart Area */}
            <div className="flex-1 min-h-[250px] relative mt-4">
              <div className="absolute inset-0 flex flex-col justify-between">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="w-full border-t border-slate-50 border-dashed"></div>
                ))}
              </div>
              <div className="relative h-full flex items-end justify-between px-2 pt-10 pb-4 gap-2">
                {chartData.data.map((c, i) => {
                  const pHeight = Math.max((c.pemasukan / chartData.max) * 100, 2); // min 2% height for visibility
                  const mHeight = Math.max((c.pengeluaran / chartData.max) * 100, 2);
                  return (
                    <div key={i} className="flex-1 flex flex-col justify-end gap-1 group relative">
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] py-1 px-2 rounded whitespace-nowrap z-10 transition-opacity">
                        + Rp {c.pemasukan.toLocaleString()} <br/> - Rp {c.pengeluaran.toLocaleString()}
                      </div>
                      <div className="w-full bg-emerald-500/80 hover:bg-emerald-400 transition-all rounded-sm" style={{ height: `${pHeight}%` }}></div>
                      <div className="w-full bg-red-400/80 hover:bg-red-300 transition-all rounded-sm" style={{ height: `${mHeight}%` }}></div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="flex justify-between mt-4 pt-4 border-t border-slate-50 text-[10px] font-medium text-slate-400">
               {chartData.labels.map((l, i) => <span key={i}>{l}</span>)}
            </div>
          </Card>
        </div>

        {/* Right Insights */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <Card>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <AlertCircle className="w-3.5 h-3.5 text-indigo-500" /> Analitik Keuangan
              </div>
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${stats?.saldoKas >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                {stats?.saldoKas >= 0 ? 'Aman' : 'Perhatian'}
              </span>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              {stats?.saldoKas >= 0 
                ? "Sistem mendeteksi stabilitas arus kas yang positif. Likuiditas perumahan dalam keadaan aman untuk operasional bulanan."
                : "Peringatan: Arus kas terdeteksi negatif. Pengeluaran melebihi pemasukan, mohon segera evaluasi keuangan perumahan."}
            </p>
            <div className="flex justify-between items-center text-xs font-medium pb-2 border-b border-slate-50 mb-2">
              <span className="text-slate-500">Total Pengeluaran</span>
              <span className="text-emerald-500 font-bold">Rp {(stats?.totalPengeluaran || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-xs font-medium">
              <span className="text-slate-500">Total Tunggakan</span>
              <span className="text-red-500 font-bold">Rp {(stats?.totalTunggakan || 0).toLocaleString()}</span>
            </div>
            <Button variant="indigo" className="w-full mt-6" iconRight={ChevronRight}>
              Lihat Analisis Penuh
            </Button>
          </Card>

          <Card className="flex-1">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-slate-900">Top Tunggakan Alert</h3>
              <span className="text-xs text-indigo-600 font-medium cursor-pointer">View All</span>
            </div>
            <div className="space-y-4">
              {topTunggakan.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">Tidak ada tunggakan</p>
              ) : topTunggakan.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-red-50 flex items-center justify-center">
                      <Users className="w-3 h-3 text-red-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{item.nama || "Unknown"}</p>
                      <p className="text-[10px] text-slate-500">{item.blok || "No Blok"}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-900">Rp {item.total.toLocaleString()}</p>
                    <span className="text-[9px] font-bold text-red-500 bg-red-50 px-1 rounded">Unpaid</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Bottom Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-slate-900">Aktivitas Terbaru</h3>
            <span className="text-xs text-indigo-600 font-medium cursor-pointer">View All</span>
          </div>
          
          <div className="space-y-3">
            {recentPayments.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">Tidak ada aktivitas</p>
            ) : recentPayments.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                    <Wallet className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{item.warga?.nama}</p>
                    <p className="text-[10px] text-slate-500">{item.warga?.blok}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded">Lunas</span>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-900">Rp {(item.jumlah || 0).toLocaleString()}</p>
                    <p className="text-[10px] text-emerald-500">+100%</p>
                  </div>
                  <MoreHorizontal className="w-4 h-4 text-slate-300" />
                </div>
              </div>
            ))}
          </div>
        </Card>
        
        {/* Placeholder for remaining layout space to match grid */}
        <Card className="flex flex-col justify-center items-center opacity-50">
          <Layers className="w-8 h-8 text-slate-300 mb-2" />
          <p className="text-xs font-medium text-slate-400">Modul Tambahan</p>
        </Card>
      </div>
    </div>
  );
}
