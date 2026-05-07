import { useState, useEffect } from "react";
import { 
 Users, 
 ArrowUp,
 ArrowDown,
 Activity,
 CircleDollarSign,
 ShoppingBag,
 TrendingUp,
 Calendar,
 Layers,
 ArrowUpRight
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button, Card, CardHeader } from "@/components/ui";
import { SelectionRequired } from "@/components/ui/SelectionRequired";

const DashboardStatCard = ({ title, value, rate, levelUp, icon: Icon, type = "neutral" }) => {
 const styles = {
  neutral: "bg-slate-950 text-white border border-slate-900 border-slate-200 shadow-none",
  success: "bg-green-50 text-green-600 border-green-100 shadow-none",
  blue: "bg-blue-50 text-blue-600 border-blue-100 shadow-none",
  amber: "bg-amber-50 text-amber-600 border-amber-100 shadow-none",
 };

 return (
  <Card className="relative overflow-hidden group">
   <div className="flex flex-col gap-8">
    <div className="flex justify-between items-start">
     <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-[0_1px_2px_rgba(0,0,0,0.03)] ${styles[type]}  transition-transform group-hover:scale-110 duration-300`}>
      <Icon className="w-5 h-5" />
     </div>
     <div className={`flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-bold  ${levelUp ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
      {rate}
      {levelUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
     </div>
    </div>
    
    <div className="space-y-1">
     <h3 className="text-xl font-bold text-slate-900 tracking-tighter">{value}</h3>
     <p className="text-xs font-bold text-slate-400 ">{title}</p>
    </div>
   </div>
   <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-slate-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
  </Card>
 );
};

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

    const [wargaRes, tagihanRes, kasRes, recentRes] = await Promise.all([
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
      .limit(5)
    ]);

    const iuranBulanIni = tagihanRes.data
     ?.filter(d => d.status === 'Paid')
     .reduce((acc, curr) => acc + (parseInt(curr.jumlah) || 0), 0) || 0;

    const totalWarga = wargaRes.count || 0;
    const sudahBayar = tagihanRes.data?.filter(d => d.status === 'Paid').length || 0;
    const ratePembayaran = totalWarga > 0 ? (sudahBayar / totalWarga) * 100 : 0;

    const pemasukan = kasRes.data?.filter(d => d.kategori === 'Pemasukan').reduce((acc, curr) => acc + parseInt(curr.jumlah), 0) || 0;
    const pengeluaran = kasRes.data?.filter(d => d.kategori === 'Pengeluaran').reduce((acc, curr) => acc + parseInt(curr.jumlah), 0) || 0;

    setStats({
     totalWarga,
     iuranBulanIni,
     ratePembayaran,
     saldoKas: pemasukan - pengeluaran
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

 return (
  <div className="flex flex-col gap-6">
   {/* Header */}
   <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
    <div>
     <h1 className="text-xl font-bold text-slate-900 tracking-tight">Executive Dashboard</h1>
     <p className="text-slate-500 text-sm font-medium">Real-time analytical overview of residential operations.</p>
    </div>
    <div className="flex items-center gap-4">
     <div className="hidden lg:flex items-center gap-3 px-5 py-2.5 bg-white border border-slate-100 rounded-2xl text-xs font-bold text-slate-400  ">
      <Calendar className="w-4 h-4 text-slate-900" />
      {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
     </div>
     <Button variant="primary" size="lg" icon={Layers}>Download Report</Button>
    </div>
   </div>

   {/* Stats Grid */}
   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {loading ? (
     Array(4).fill(0).map((_, i) => (
      <div key={i} className="bg-white h-48 rounded-2xl border border-slate-50  shadow-none animate-pulse"></div>
     ))
    ) : (
     <>
      <DashboardStatCard title="Residential Base" value={stats?.totalWarga?.toString()} rate="Verified" levelUp icon={Users} type="blue" />
      <DashboardStatCard title="Collected Fees" value={`Rp ${(stats?.iuranBulanIni || 0).toLocaleString()}`} rate="Targeted" levelUp icon={ShoppingBag} type="success" />
      <DashboardStatCard title="Payment Velocity" value={`${(stats?.ratePembayaran || 0).toFixed(1)}%`} rate="Real-time" levelUp={stats?.ratePembayaran > 50} icon={Activity} type="amber" />
      <DashboardStatCard title="Net Balance" value={`Rp ${(stats?.saldoKas || 0).toLocaleString()}`} rate="Liquidity" levelUp icon={CircleDollarSign} type="neutral" />
     </>
    )}
   </div>

   {/* Main Analytical Section */}
   <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
    {/* Performance Chart */}
    <div className="lg:col-span-2">
     <Card hFull noPadding>
      <CardHeader 
       title="Revenue Performance" 
       subtitle="Analytical distribution of monthly cashflow"
       action={
        <div className="flex gap-6">
         <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-950"></div>
          <span className="text-[9px] font-bold text-slate-400 ">Inflow</span>
         </div>
         <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-200"></div>
          <span className="text-[9px] font-bold text-slate-400 ">Outflow</span>
         </div>
        </div>
       }
      />
      <div className="p-6 flex-col gap-6">
       <div className="flex items-end justify-between h-[320px] gap-4 mb-8">
        {[45, 65, 35, 85, 50, 95, 60, 40, 75, 55, 80, 70].map((h, i) => (
         <div key={i} className="flex-1 flex flex-col gap-2 group relative">
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[8px] font-bold px-5 py-2.5 rounded-lg">
           {h}%
          </div>
          <div 
           className="w-full bg-slate-950 rounded-2xl transition-all group-hover:bg-black group-hover:scale-x-110 duration-500  shadow-none" 
           style={{ height: `${h}%` }}
          ></div>
          <div 
           className="w-full bg-slate-100 rounded-2xl transition-all" 
           style={{ height: `${20}%` }}
          ></div>
         </div>
        ))}
       </div>
       <div className="flex justify-between px-2 pt-6 border-t border-slate-50">
        {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => (
         <span key={m} className="text-xs font-bold text-slate-300 tracking-[0.3em]">{m}</span>
        ))}
       </div>
      </div>
     </Card>
    </div>

    {/* Real-time Transactions */}
    <div className="lg:col-span-1">
     <Card hFull noPadding className="flex flex-col">
      <CardHeader 
       title="Recent Activity" 
       subtitle="Latest transactional verification" 
      />
      <div className="p-4 flex-1 space-y-2">
       {loading ? (
        Array(6).fill(0).map((_, i) => (
         <div key={i} className="h-16 bg-slate-50 rounded-2xl m-2 animate-pulse"></div>
        ))
       ) : recentPayments.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center p-12 text-center opacity-40">
         <Activity className="w-10 h-10 mb-4 text-slate-200" />
         <p className="text-xs font-bold  text-slate-400 italic">No activity detected.</p>
        </div>
       ) : recentPayments.map((item) => (
        <div key={item.id} className="flex justify-between items-center p-5 hover:bg-slate-50 rounded-xl transition-all group border border-transparent hover:border-slate-100">
         <div className="flex items-center gap-5">
          <div className="w-10 h-10 bg-slate-950 rounded-2xl flex items-center justify-center shadow-[0_1px_2px_rgba(0,0,0,0.03)] text-white font-bold text-sm  shadow-none transition-transform group-hover:scale-110 duration-500">
           {item.warga?.nama?.charAt(0)}
          </div>
          <div>
           <p className="text-sm font-bold text-slate-900 tracking-tight">{item.warga?.nama}</p>
           <p className="text-[9px] font-bold text-slate-400 ">
            {new Date(item.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} • {item.warga?.blok}
           </p>
          </div>
         </div>
         <div className="text-right">
          <p className="text-sm font-bold text-slate-950 tracking-tighter">Rp {(item.jumlah || 0).toLocaleString()}</p>
          <div className="flex items-center gap-1.5 text-[8px] font-bold text-green-500  justify-end mt-1">
           <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div> Verified
          </div>
         </div>
        </div>
       ))}
      </div>
      <div className="p-8 border-t border-slate-50 mt-auto">
       <Button variant="ghost" className="w-full text-xs font-bold  py-4" size="sm">View Audit Trail</Button>
      </div>
     </Card>
    </div>
   </div>
  </div>
 );
}
