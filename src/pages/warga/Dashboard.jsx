import { useState, useEffect, useCallback } from "react";
import { 
  LayoutDashboard,
  ReceiptText,
  Megaphone,
  Package,
  MessageSquare,
  ArrowRight,
  TrendingUp,
  Bell,
  CheckCircle2
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

const QuickAction = ({ label, to, color }) => {
  const colorMap = {
    red: "bg-slate-50 text-rose-500 group-hover:border-rose-100",
    indigo: "bg-slate-50 text-slate-900 group-hover:border-slate-200",
    green: "bg-slate-50 text-emerald-600 group-hover:border-emerald-100"
  };

  const themeClass = colorMap[color] || colorMap.indigo;

  return (
    <Link to={to} className="w-full group">
      <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 transition-all duration-300 group-hover:shadow-md group-hover:translate-x-1 flex items-center gap-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${themeClass.split(' ').slice(0, 2).join(' ')}`}>
        </div>
        <div className="flex flex-col flex-1">
          <span className="font-bold text-sm text-slate-900 group-hover:text-slate-950 transition-colors">{label}</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Detail Interaksi</span>
        </div>
        <ArrowRight size={14} className="text-slate-300 group-hover:text-slate-900 group-hover:translate-x-1 transition-all" />
      </div>
    </Link>
  );
};

export default function WargaDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    tagihanUnpaid: 0,
    pengumumanBaru: 0,
    asetDipinjam: 0
  });
  const [recentAnnouncements, setRecentAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      if (!profile?.perumahan_id || !profile?.warga_id) return;

      const [tagihanRes, pengumumanRes, peminjamanRes] = await Promise.all([
        supabase
          .from('tagihan')
          .select('id', { count: 'exact' })
          .eq('warga_id', profile.warga_id)
          .eq('status', 'Unpaid'),
        supabase
          .from('pengumuman')
          .select('*')
          .eq('perumahan_id', profile.perumahan_id)
          .order('created_at', { ascending: false })
          .limit(3),
        supabase
          .from('peminjaman_aset')
          .select('id', { count: 'exact' })
          .eq('warga_id', profile.warga_id)
          .in('status', ['Dipinjam', 'Pending'])
      ]);

      const unpaidCount = tagihanRes.count;
      const announcements = pengumumanRes.data;
      const borrowedCount = peminjamanRes.count;

      setRecentAnnouncements(announcements || []);

      setStats({
        tagihanUnpaid: unpaidCount || 0,
        pengumumanBaru: announcements?.length || 0,
        asetDipinjam: borrowedCount || 0
      });

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    const init = async () => {
      await fetchDashboardData();
    };
    init();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div className="p-32 text-center">
        <div className="w-12 h-12 bg-slate-50 rounded-2xl mx-auto mb-8 animate-pulse"></div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Memuat Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Selamat Datang, {profile?.nama} 👋</h1>
          <p className="text-slate-500 text-sm mt-1">Ringkasan aktivitas unit Anda hari ini</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 px-4 py-2.5 bg-white border border-slate-100 rounded-xl shadow-sm">
            <div className="flex flex-col items-end">
              <span className="text-[11px] font-semibold text-slate-400">Status Warga</span>
              <span className="text-sm font-bold text-emerald-600">Terverifikasi</span>
            </div>
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
              <CheckCircle2 size={18} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flex flex-col gap-6 p-8 relative overflow-hidden group bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex justify-between items-start relative z-10">
            <div className="w-14 h-14 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform duration-300">
              <ReceiptText size={24} />
            </div>
            {stats.tagihanUnpaid > 0 && (
              <span className="px-3 py-1 bg-rose-500 text-white text-[10px] font-bold rounded-full animate-pulse shadow-sm">Action Required</span>
            )}
          </div>
          <div className="space-y-1 relative z-10">
            <p className="text-xs font-semibold text-slate-400">Tagihan Belum Lunas</p>
            <div className="flex items-end gap-2">
              <p className="text-3xl font-bold text-slate-900 tracking-tight">{stats.tagihanUnpaid}</p>
              <p className="text-xs font-medium text-slate-400 mb-1">Bulan</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6 p-8 relative overflow-hidden group bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex justify-between items-start relative z-10">
            <div className="w-14 h-14 bg-slate-50 rounded-xl flex items-center justify-center text-slate-900 group-hover:scale-110 transition-transform duration-300 border border-slate-100">
              <Package size={24} />
            </div>
          </div>
          <div className="space-y-1 relative z-10">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Aset Dipinjam</p>
            <div className="flex items-end gap-2">
              <p className="text-3xl font-bold text-slate-900 tracking-tight">{stats.asetDipinjam}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Item Aktif</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6 p-8 relative overflow-hidden group bg-slate-900 text-white rounded-2xl shadow-xl shadow-slate-200 transition-all duration-300">
          <div className="flex justify-between items-start relative z-10">
            <div className="w-14 h-14 bg-white/5 rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300 border border-white/10">
              <Megaphone size={24} />
            </div>
          </div>
          <div className="space-y-1 relative z-10">
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Pengumuman Baru</p>
            <div className="flex items-end gap-2">
              <p className="text-3xl font-bold text-white tracking-tight">{stats.pengumumanBaru}</p>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Pesan</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Announcements Feed */}
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold flex items-center gap-3 text-slate-900 tracking-tight">
            <Bell size={20} className="text-indigo-500" /> Pengumuman Resmi
          </h2>
          <div className="flex flex-col gap-3">
            {recentAnnouncements.length === 0 ? (
              <div className="p-10 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                <p className="text-slate-400 italic font-medium">Belum ada pengumuman hari ini.</p>
              </div>
            ) : (
              recentAnnouncements.map((ann) => (
                <div 
                  key={ann.id} 
                  className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-center mb-3">
                    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md ${ann.kategori === 'Urgent' ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600'}`}>
                      {ann.kategori}
                    </span>
                    <p className="text-xs font-semibold text-slate-400">
                      {new Date(ann.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-2 leading-tight">{ann.judul}</h3>
                  <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed font-medium">
                    {ann.konten}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold flex items-center gap-3 text-slate-900 tracking-tight">
            <LayoutDashboard size={20} className="text-indigo-500" /> Akses Cepat
          </h2>
          <div className="flex flex-col gap-3">
            <QuickAction icon={ReceiptText} label="Lihat Detail Tagihan" to="/my-bills" color="red" />
            <QuickAction icon={Package} label="Ajukan Pinjam Aset" to="/borrow-assets" color="indigo" />
            <QuickAction icon={MessageSquare} label="Diskusi di Forum" to="/forum" color="green" />
          </div>
        </div>
      </div>
    </div>
  );
}
