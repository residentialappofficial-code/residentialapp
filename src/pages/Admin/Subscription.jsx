import React, { useState, useEffect } from "react";
import { 
  CreditCard, 
  Calendar, 
  Zap, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Coins, 
  HelpCircle,
  ExternalLink
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button, Card, CardHeader, Badge } from "@/components/ui";

export default function Subscription() {
  const { profile, isSuspended } = useAuth();
  const perumahan = profile?.perumahan;
  const perumahanId = perumahan?.id;

  const [loading, setLoading] = useState(false);
  const [pakasirSlug, setPakasirSlug] = useState("habitix");
  const [selectedPlan, setSelectedPlan] = useState("monthly");

  // Fetch Pakasir Slug dynamically
  useEffect(() => {
    async function fetchSystemSettings() {
      try {
        const { data } = await supabase
          .from("system_settings")
          .select("*")
          .eq("key", "pakasir_slug")
          .maybeSingle();
        if (data?.value) {
          setPakasirSlug(data.value);
        }
      } catch (err) {
        console.error("Error fetching system settings:", err);
      }
    }
    fetchSystemSettings();
  }, []);

  const handleCheckout = () => {
    if (!perumahanId) return;
    
    setLoading(true);
    
    // Pricing configurations
    const amount = selectedPlan === "yearly" ? 1500000 : 150000;
    const timestamp = Math.floor(Date.now() / 1000);
    
    // Order ID format: SUB_[PERUMAHAN_ID]_[PLAN_TYPE]_[TIMESTAMP]
    const orderId = `SUB_${perumahanId}_${selectedPlan}_${timestamp}`;
    const redirectUrl = encodeURIComponent(`${window.location.origin}/subscription`);
    const checkoutUrl = `https://app.pakasir.com/pay/${pakasirSlug}/${amount}?order_id=${orderId}&qris_only=1&redirect=${redirectUrl}`;
    
    // Redirect user to Pakasir
    window.location.href = checkoutUrl;
  };

  // Calculate days remaining
  const getDaysRemaining = () => {
    if (!perumahan?.subscription_valid_until) return 0;
    const expiry = new Date(perumahan.subscription_valid_until);
    const diffTime = expiry - new Date();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const daysRemaining = getDaysRemaining();
  const validUntilStr = perumahan?.subscription_valid_until 
    ? new Date(perumahan.subscription_valid_until).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    : "-";

  return (
    <div className="max-w-full mx-auto flex flex-col gap-6 md:gap-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Langganan Habitix</h1>
        <p className="text-slate-500 text-sm mt-1">Kelola lisensi platform dan pembayaran sewa perumahan Anda.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sisi Kiri: Status & Pilihan Paket */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          
          {/* Card Status Aktif */}
          <Card className="relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-50/40 rounded-full blur-3xl -z-10"></div>
            
            <div className="p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${
                    isSuspended ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
                  }`}>
                    {isSuspended ? <AlertTriangle className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 leading-none">Status Lisensi</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">{perumahan?.nama || "Perumahan"}</p>
                  </div>
                </div>
                <Badge variant={isSuspended ? "red" : "green"}>
                  {isSuspended ? "Ditangguhkan / Kadaluwarsa" : "Aktif"}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-50">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sisa Masa Aktif</span>
                  <span className={`text-xl font-bold ${isSuspended ? 'text-red-500' : 'text-slate-900'}`}>
                    {isSuspended ? "Habis Masa Aktif" : `${daysRemaining} Hari`}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Berlaku Hingga</span>
                  <span className="text-sm font-semibold text-slate-800 flex items-center gap-1.5 mt-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {validUntilStr}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tipe Paket</span>
                  <span className="text-sm font-semibold text-indigo-600 mt-1 uppercase tracking-wide">
                    Paket {perumahan?.subscription_plan || "Trial"}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Pemilihan Paket */}
          <Card noPadding>
            <CardHeader 
              title="Pilih Paket Lisensi" 
              subtitle="Perpanjang akses platform dengan pembayaran QRIS aman via Pakasir"
            />
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Paket Bulanan */}
                <button
                  onClick={() => setSelectedPlan("monthly")}
                  className={`p-6 rounded-2xl border text-left transition-all duration-300 relative flex flex-col justify-between group overflow-hidden ${
                    selectedPlan === "monthly"
                      ? "border-slate-900 bg-slate-950/[0.02] shadow-sm shadow-slate-100"
                      : "border-slate-100 hover:border-slate-200 hover:bg-slate-50/50"
                  }`}
                >
                  <div className="space-y-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      selectedPlan === "monthly" ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-400"
                    }`}>
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-slate-900 leading-tight">Paket Bulanan</h4>
                      <p className="text-xs text-slate-400 font-medium mt-1">Pembayaran bulanan reguler</p>
                    </div>
                  </div>
                  <div className="mt-8 flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-slate-900">Rp 150.000</span>
                    <span className="text-xs text-slate-400 font-bold">/ bulan</span>
                  </div>
                  {selectedPlan === "monthly" && (
                    <div className="absolute top-4 right-4 text-slate-900"><CheckCircle2 className="w-5 h-5 fill-slate-900 text-white" /></div>
                  )}
                </button>

                {/* Paket Tahunan */}
                <button
                  onClick={() => setSelectedPlan("yearly")}
                  className={`p-6 rounded-2xl border text-left transition-all duration-300 relative flex flex-col justify-between group overflow-hidden ${
                    selectedPlan === "yearly"
                      ? "border-slate-900 bg-slate-950/[0.02] shadow-sm shadow-slate-100"
                      : "border-slate-100 hover:border-slate-200 hover:bg-slate-50/50"
                  }`}
                >
                  <div className="absolute -right-8 -top-8 w-24 h-24 bg-indigo-50/50 rounded-full blur-xl group-hover:bg-indigo-100/50 transition-all duration-500"></div>
                  <div className="space-y-4 relative z-10">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      selectedPlan === "yearly" ? "bg-indigo-600 text-white" : "bg-slate-50 text-slate-400"
                    }`}>
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-slate-900 leading-tight">Paket Tahunan</h4>
                      <p className="text-xs text-slate-400 font-medium mt-1">Sewa jangka panjang hemat 2 bulan</p>
                    </div>
                  </div>
                  <div className="mt-8 flex items-baseline gap-1 relative z-10">
                    <span className="text-2xl font-bold text-slate-900">Rp 1.500.000</span>
                    <span className="text-xs text-slate-400 font-bold">/ tahun</span>
                  </div>
                  <div className="absolute top-4 right-4 flex items-center gap-2">
                    <Badge variant="blue" className="text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 border-indigo-100">Hemat 17%</Badge>
                    {selectedPlan === "yearly" && (
                      <CheckCircle2 className="w-5 h-5 fill-indigo-600 text-white" />
                    )}
                  </div>
                </button>
              </div>

              <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Rincian Pembayaran</div>
                  <div className="text-lg font-bold text-slate-950">
                    Rp {selectedPlan === "yearly" ? "1.500.000" : "150.000"} 
                    <span className="text-xs font-medium text-slate-500 ml-1.5">untuk perpanjangan {selectedPlan === "yearly" ? "365 hari" : "30 hari"}</span>
                  </div>
                </div>
                <Button
                  onClick={handleCheckout}
                  isLoading={loading}
                  variant="dark"
                  size="lg"
                  className="w-full sm:w-auto text-sm shadow-md"
                  iconRight={ExternalLink}
                >
                  Bayar via QRIS Pakasir
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Sisi Kanan: Panduan / FAQs */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <Card className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white shadow-xl shadow-indigo-100">
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-base leading-none">Mengapa Habitix?</h4>
                  <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider mt-1.5">Nilai Tambah Platform</p>
                </div>
              </div>
              
              <ul className="space-y-3.5 text-xs text-indigo-100/90 font-medium">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-white shrink-0 mt-0.5" />
                  <span>Manajemen data warga & blok perumahan tanpa batas.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-white shrink-0 mt-0.5" />
                  <span>Integrasi sistem pembayaran iuran otomatis (QRIS) via Pakasir.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-white shrink-0 mt-0.5" />
                  <span>Arus kas keuangan, pencatatan otomatis, & ekspor laporan PDF/XLSX.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-white shrink-0 mt-0.5" />
                  <span>Forum interaktif warga & moderasi keluhan real-time.</span>
                </li>
              </ul>
            </div>
          </Card>

          <Card className="group">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-2.5 text-slate-800 font-bold text-sm">
                <HelpCircle className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                <span>Bantuan & Informasi</span>
              </div>
              <div className="space-y-4 text-xs text-slate-500 font-medium leading-relaxed">
                <div>
                  <h5 className="font-bold text-slate-700">Bagaimana aktivasi dilakukan?</h5>
                  <p className="mt-1">Setelah melakukan pembayaran QRIS hingga sukses di halaman checkout, masa aktif langganan perumahan Anda akan otomatis bertambah saat itu juga.</p>
                </div>
                <div>
                  <h5 className="font-bold text-slate-700">Bagaimana jika masa aktif habis?</h5>
                  <p className="mt-1">Layanan operasional perumahan akan ditangguhkan sementara. Warga tidak dapat membayar iuran atau mengakses forum sampai masa aktif diperpanjang kembali.</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
