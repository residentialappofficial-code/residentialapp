import { useState, useEffect } from "react";
import { Save, Info, Settings2, Calculator, ShieldCheck, Zap } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button, Input, Card, CardHeader } from "@/components/ui";

export default function IuranConfig() {
 const { selectedPerumahanId } = useAuth();
 const [loading, setLoading] = useState(true);
 const [saving, setSaving] = useState(false);
 const [config, setConfig] = useState({
  tipe: "flat",
  tarif_dasar: 0, 
  rekening_no: "", 
  rekening_bank: "", 
  rekening_nama: "", 
  qris_url: ""
 });

 useEffect(() => {
  async function fetchConfig() {
   if (!selectedPerumahanId) return;
   try {
    const { data } = await supabase
     .from("iuran_config")
     .select("*")
     .eq("perumahan_id", selectedPerumahanId)
     .maybeSingle();

    if (data) {
     setConfig({
      tipe: data.tipe,
      tarif_dasar: data.tarif_dasar, 
      rekening_no: data.rekening_no || "", 
      rekening_bank: data.rekening_bank || "", 
      rekening_nama: data.rekening_nama || "", 
      qris_url: data.qris_url || ""
     });
    }
   } catch (err) {
    console.error("Error fetching config:", err);
   } finally {
    setLoading(false);
   }
  }
  fetchConfig();
 }, [selectedPerumahanId]);

 const handleSave = async () => {
  setSaving(true);
  try {
   const { error } = await supabase
    .from("iuran_config")
    .upsert({
     perumahan_id: selectedPerumahanId,
     tipe: config.tipe,
     tarif_dasar: config.tarif_dasar, 
     rekening_no: config.rekening_no, 
     rekening_bank: config.rekening_bank, 
     rekening_nama: config.rekening_nama, 
     qris_url: config.qris_url
    }, { onConflict: 'perumahan_id' });

   if (error) throw error;
   alert("Konfigurasi berhasil disimpan!");
  } catch (err) {
   alert("Gagal menyimpan konfigurasi: " + err.message);
  } finally {
   setSaving(false);
  }
 };

 if (loading) return (
  <div className="p-24 text-center">
   <div className="w-10 h-10 bg-slate-50 rounded-2xl mx-auto mb-6 animate-pulse"></div>
   <p className="text-xs font-bold text-slate-400 tracking-[0.3em]">Synchronizing Configuration...</p>
  </div>
 );

 return (
  <div className="max-w-full mx-auto flex flex-col gap-6">
   {/* Header */}
   <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
    <div>
     <h1 className="text-xl font-bold text-slate-900 tracking-tight">Fee Configuration</h1>
     <p className="text-slate-500 text-sm font-medium">Define logic and variables for residential billing cycles.</p>
    </div>
    <Button
     onClick={handleSave}
     isLoading={saving}
     variant="primary"
     size="lg"
     icon={Save}
     className="px-10  shadow-none"
    >
     Save System Variables
    </Button>
   </div>

   <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
    {/* Left: Logic Settings */}
    <div className="lg:col-span-8 flex flex-col gap-8">
     <Card hFull noPadding>
      <CardHeader 
       title="Calculation Logic" 
       subtitle="Select the primary mathematical model for billing"
      />
      
      <div className="p-6 flex flex-col gap-6">
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
         onClick={() => setConfig({ ...config, tipe: "flat" })}
         className={`p-8 rounded-xl border-2 transition-all text-left flex flex-col gap-6 group relative overflow-hidden ${
          config.tipe === "flat"
           ? "border-slate-950 bg-slate-50  shadow-none"
           : "border-slate-100 hover:border-slate-200 hover:bg-slate-50/50"
         }`}
        >
         <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-transform group-hover:scale-110 duration-500 ${config.tipe === 'flat' ? 'bg-slate-950 text-white border border-slate-900  shadow-none' : 'bg-white border border-slate-100 text-slate-300'}`}>
          <Settings2 className="w-5 h-5" />
         </div>
         <div>
          <div className="font-bold text-slate-900 text-lg mb-1 tracking-tight">Fixed Flat Rate</div>
          <div className="text-xs text-slate-400 font-bold  leading-relaxed">Unified monthly fee across all units</div>
         </div>
         {config.tipe === 'flat' && <div className="absolute top-4 right-4 text-slate-950"><ShieldCheck className="w-5 h-5" /></div>}
        </button>

        <button
         onClick={() => setConfig({ ...config, tipe: "m2" })}
         className={`p-8 rounded-xl border-2 transition-all text-left flex flex-col gap-6 group relative overflow-hidden ${
          config.tipe === "m2"
           ? "border-slate-950 bg-slate-50  shadow-none"
           : "border-slate-100 hover:border-slate-200 hover:bg-slate-50/50"
         }`}
        >
         <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-transform group-hover:scale-110 duration-500 ${config.tipe === 'm2' ? 'bg-slate-950 text-white border border-slate-900  shadow-none' : 'bg-white border border-slate-100 text-slate-300'}`}>
          <Calculator className="w-5 h-5" />
         </div>
         <div>
          <div className="font-bold text-slate-900 text-lg mb-1 tracking-tight">Area-Based Multiplier</div>
          <div className="text-xs text-slate-400 font-bold  leading-relaxed">Calculated based on land area (m²)</div>
         </div>
         {config.tipe === 'm2' && <div className="absolute top-4 right-4 text-slate-950"><ShieldCheck className="w-5 h-5" /></div>}
        </button>
       </div>

       <div className="bg-white border border-slate-100 rounded-xl p-8 space-y-6">
        <div className="flex items-center gap-3 mb-2">
         <div className="w-5 h-5 bg-slate-950 rounded-lg flex items-center justify-center text-white">
          <Zap className="w-4 h-4" />
         </div>
         <h4 className="text-xs font-bold text-slate-400 ">Parameter Definition</h4>
        </div>
        <Input
         label={config.tipe === "flat" ? "Monthly Standard Fee (Rp)" : "Rate per Square Meter (Rp/m²)"}
         type="number"
         value={config.tarif_dasar}
         onChange={(e) => setConfig({ ...config, tarif_dasar: parseInt(e.target.value) || 0 })}
         placeholder="Example: 50000"
         icon={() => <span className="text-xs font-bold text-slate-900">IDR</span>}
         className="bg-slate-50/50"
        />
       </div>
      </div>
     </Card>

     <Card noPadding>
      <CardHeader 
       title="Payment Destination" 
       subtitle="Configure bank account and QRIS for manual resident transfers"
      />
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Input 
            label="Bank Name"
            value={config.rekening_bank}
            onChange={(e) => setConfig({...config, rekening_bank: e.target.value})}
            placeholder="e.g. Bank Mandiri"
          />
          <Input 
            label="Account Number"
            value={config.rekening_no}
            onChange={(e) => setConfig({...config, rekening_no: e.target.value})}
            placeholder="e.g. 1234567890"
          />
          <Input 
            label="Account Holder Name"
            value={config.rekening_nama}
            onChange={(e) => setConfig({...config, rekening_nama: e.target.value})}
            placeholder="e.g. Paguyuban Cendana"
          />
        </div>
        <div className="space-y-6">
          <Input 
            label="QRIS Image URL (Optional)"
            value={config.qris_url}
            onChange={(e) => setConfig({...config, qris_url: e.target.value})}
            placeholder="https://..."
          />
          <div className="p-8 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center gap-4 bg-slate-50/30">
            {config.qris_url ? (
              <img src={config.qris_url} alt="QRIS Preview" className="max-h-48 rounded-lg shadow-sm" />
            ) : (
              <div className="text-center py-4">
                <p className="text-xs font-bold text-slate-400">QRIS Preview will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
     </Card>
    </div>

    {/* Right: Simulation & Insights */}
    <div className="lg:col-span-4 flex flex-col gap-8">
     <div className="bg-slate-950 p-6 rounded-2xl text-white  shadow-none space-y-8 relative overflow-hidden group">
      <div className="absolute -right-10 -top-6 w-48 h-48 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-all duration-700"></div>
      <div className="relative z-10 flex items-center gap-4">
       <div className="p-3 bg-white/10 rounded-2xl">
        <Calculator className="w-5 h-5" />
       </div>
       <div>
        <h3 className="font-bold text-xl tracking-tight">Simulation</h3>
        <p className="text-white/40 text-xs font-bold ">Billing Estimator</p>
       </div>
      </div>
      
      <div className="space-y-6 pt-8 border-t border-white/10 relative z-10">
       <div className="flex justify-between items-end">
        <div className="flex flex-col gap-1">
         <span className="text-[9px] font-bold text-white/30 ">Sample Case</span>
         <span className="text-xs font-bold">100m² Unit</span>
        </div>
        <div className="text-2xl font-bold tracking-tighter">
         <span className="text-xs font-bold opacity-30 mr-1.5 ">Rp</span>
         {config.tipe === "flat" 
          ? config.tarif_dasar.toLocaleString() 
          : (config.tarif_dasar * 100).toLocaleString()}
        </div>
       </div>
       <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
        <p className="text-xs text-white/50 leading-relaxed font-bold italic">
         * Note: System variables are applied globally. Changes will affect the next generation cycle.
        </p>
       </div>
      </div>
     </div>

     <Card className="group">
      <div className="p-6 space-y-6 text-center">
       <div className="w-10 h-10 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 mx-auto shadow-none transition-transform group-hover:scale-110">
        <Info className="w-5 h-5" />
       </div>
       <div className="space-y-2">
        <h4 className="text-xs font-bold tracking-[0.3em] text-slate-400">Critical Requirement</h4>
        <p className="text-xs text-slate-500 leading-relaxed font-bold">
         For **Area-Based** logic, ensure all unit land measurements are verified in the resident directory for accurate computation.
        </p>
       </div>
      </div>
     </Card>
    </div>
   </div>
  </div>
 );
}
