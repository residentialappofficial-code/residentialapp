import { useState, useEffect } from "react";
import { 
  Users, 
  ArrowUp,
  ArrowDown,
  Activity,
  CircleDollarSign,
  ShoppingBag
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

const StatCard = (props) => {
  const { title, value, rate, levelUp, icon: Icon } = props;
  return (
    <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex flex-col gap-4">
      <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center">
        <Icon className="text-indigo-600 w-6 h-6" />
      </div>
      <div className="flex items-end justify-between">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
          <p className="text-sm font-medium text-slate-500">{title}</p>
        </div>
        <div className={`flex items-center gap-1 text-sm font-medium ${levelUp ? 'text-green-500' : 'text-red-500'}`}>
          <span>{rate}</span>
          {levelUp ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
        </div>
      </div>
    </div>
  );
};

import { SelectionRequired } from "@/components/ui/SelectionRequired";

export default function Dashboard() {
  const { selectedPerumahanId, profile } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

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

        const [wargaRes, iuranRes, kasRes] = await Promise.all([
          supabase.from("warga").select("id", { count: "exact" }).eq("perumahan_id", selectedPerumahanId),
          supabase.from("pembayaran_iuran")
            .select("jumlah, status")
            .eq("perumahan_id", selectedPerumahanId)
            .eq("bulan", currentMonth)
            .eq("tahun", currentYear),
          supabase.from("arus_kas")
            .select("jumlah, tipe")
            .eq("perumahan_id", selectedPerumahanId)
        ]);

        // Hitung Total Iuran Masuk (Lunas) bulan ini
        const iuranBulanIni = iuranRes.data
          ?.filter(d => d.status === 'Lunas')
          .reduce((acc, curr) => acc + (curr.jumlah || 0), 0) || 0;

        // Hitung Persentase Pembayaran
        const totalWarga = wargaRes.count || 0;
        const sudahBayar = iuranRes.data?.filter(d => d.status === 'Lunas').length || 0;
        const ratePembayaran = totalWarga > 0 ? (sudahBayar / totalWarga) * 100 : 0;

        // Hitung Saldo Kas
        const pemasukan = kasRes.data?.filter(d => d.tipe === 'Masuk').reduce((acc, curr) => acc + curr.jumlah, 0) || 0;
        const pengeluaran = kasRes.data?.filter(d => d.tipe === 'Keluar').reduce((acc, curr) => acc + curr.jumlah, 0) || 0;

        setStats({
          totalWarga,
          iuranBulanIni,
          ratePembayaran,
          saldoKas: pemasukan - pengeluaran
        });
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
    <div className="bg-transparent">
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
            <p className="text-slate-500 text-sm">Monitor your residential operations.</p>
          </div>
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:opacity-90 transition-all">
            Generate Report
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="bg-white h-32 rounded-lg border border-slate-200 animate-pulse"></div>
            ))
          ) : (
            <>
              <StatCard title="Total Warga" value={(stats?.totalWarga || 0).toString()} rate="Aktif" levelUp icon={Users} />
              <StatCard title="Iuran Bulan Ini" value={`Rp ${(stats?.iuranBulanIni || 0).toLocaleString()}`} rate="Terkumpul" levelUp icon={ShoppingBag} />
              <StatCard title="Tingkat Pembayaran" value={`${(stats?.ratePembayaran || 0).toFixed(1)}%`} rate="Sudah Bayar" levelUp icon={Activity} />
              <StatCard title="Saldo Kas" value={`Rp ${(stats?.saldoKas || 0).toLocaleString()}`} rate="Tersedia" levelUp icon={CircleDollarSign} />
            </>
          )}
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-6">Revenue Analysis</h2>
            <div className="h-64 border-l border-b border-slate-200 flex items-end justify-between px-4">
              {[40, 60, 30, 80, 55, 90, 45].map((h, i) => (
                <div key={i} className="w-10 bg-indigo-600 rounded-t" style={{ height: `${h}%` }}></div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-6">Recent Payments</h2>
            <div className="flex flex-col gap-4">
              {[
                { user: "Budi Santoso", amount: "Rp 150K", time: "2m ago" },
                { user: "Siti Aminah", amount: "Rp 200K", time: "5h ago" },
                { user: "Andi Wijaya", amount: "Rp 150K", time: "1d ago" }
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xs">
                      {item.user.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{item.user}</p>
                      <p className="text-xs text-slate-500">{item.time}</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-indigo-600">{item.amount}</p>
                </div>
              ))}
            </div>
            <button className="w-full mt-6 text-sm font-semibold text-indigo-600 hover:underline">
              View All Transactions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
