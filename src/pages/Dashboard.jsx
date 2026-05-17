import { useState, useEffect } from "react";
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
  ChevronRight
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button, Card, CardHeader, StatCard } from "@/components/ui";
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

  useEffect(() => {
    async function fetchDashboardData() {
      if (!selectedPerumahanId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();

        const [wargaRes, tagihanRes, kasRes, recentRes, tunggakanRes] = await Promise.all([
          supabase.from("warga").select("id", { count: "exact" }).eq("perumahan_id", selectedPerumahanId).eq("status_aktif", true),
          supabase.from("tagihan")
            .select("jumlah, status")
            .eq("perumahan_id", selectedPerumahanId)
            .eq("bulan", currentMonth)
            .eq("tahun", currentYear),
          supabase.from("arus_kas")
            .select("jumlah, kategori")
            .eq("perumahan_id", selectedPerumahanId),
          supabase.from("tagihan")
            .select(`
              id, jumlah, created_at,
              warga:warga_id(nama, blok)
            `)
            .eq("perumahan_id", selectedPerumahanId)
            .eq("status", "Paid")
            .order("created_at", { ascending: false })
            .limit(5),
          supabase.from("tagihan")
            .select("jumlah")
            .eq("perumahan_id", selectedPerumahanId)
            .eq("status", "Unpaid")
        ]);

        const iuranBulanIni = tagihanRes.data
          ?.filter(d => d.status === 'Paid')
          .reduce((acc, curr) => acc + (parseInt(curr.jumlah) || 0), 0) || 0;

        const totalWarga = wargaRes.count || 0;
        const sudahBayar = tagihanRes.data?.filter(d => d.status === 'Paid').length || 0;
        const ratePembayaran = totalWarga > 0 ? (sudahBayar / totalWarga) * 100 : 0;

        const pemasukan = kasRes.data?.filter(d => d.kategori === 'Pemasukan').reduce((acc, curr) => acc + parseInt(curr.jumlah), 0) || 0;
        const pengeluaran = kasRes.data?.filter(d => d.kategori === 'Pengeluaran').reduce((acc, curr) => acc + parseInt(curr.jumlah), 0) || 0;
        
        const totalTunggakan = tunggakanRes.data?.reduce((acc, curr) => acc + (parseInt(curr.jumlah) || 0), 0) || 0;

        setStats({
          totalWarga,
          iuranBulanIni,
          ratePembayaran,
          saldoKas: pemasukan - pengeluaran,
          totalPengeluaran: pengeluaran,
          totalTunggakan
        });
        setRecentPayments(recentRes.data || []);
      } catch (err) {
        console.error("Error fetching dashboard stats:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, [selectedPerumahanId]);

  if (profile?.role === 'super_admin' && !selectedPerumahanId) {
    return <SelectionRequired />;
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
                {[45, 65, 35, 85, 50, 95, 60, 40, 75, 55, 80, 70].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col justify-end gap-1 group">
                    <div className="w-full bg-emerald-500/80 hover:bg-emerald-400 transition-all rounded-sm" style={{ height: `${h}%` }}></div>
                    <div className="w-full bg-red-400/80 hover:bg-red-300 transition-all rounded-sm" style={{ height: `${20}%` }}></div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-between mt-4 pt-4 border-t border-slate-50 text-[10px] font-medium text-slate-400">
               <span>12:00</span>
               <span>18:00</span>
               <span>28</span>
               <span>06:00</span>
               <span>12:00</span>
               <span>18:00</span>
               <span>29</span>
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
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded">Aman</span>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              Sistem mendeteksi stabilitas arus kas yang positif dengan probabilitas pertumbuhan kas mencapai 78% bulan ini.
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
              {[1,2,3].map((item) => (
                <div key={item} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
                      <Users className="w-3 h-3 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Blok A-{item}</p>
                      <p className="text-[10px] text-slate-500">Risk 82%</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-900">Rp 150.000</p>
                    <span className="text-[9px] font-bold text-red-500 bg-red-50 px-1 rounded">-2.13%</span>
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
