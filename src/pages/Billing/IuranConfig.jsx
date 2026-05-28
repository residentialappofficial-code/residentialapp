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
    qris_url: "",
    use_unique_code: true
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
            qris_url: data.qris_url || "",
            use_unique_code: data.use_unique_code ?? true
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
          qris_url: config.qris_url,
          use_unique_code: config.use_unique_code
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
    <div className="p-32 text-center">
      <div className="w-12 h-12 bg-slate-50 rounded-2xl mx-auto mb-8 animate-pulse"></div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Menyelaraskan Konfigurasi...</p>
    </div>
  );

  return (
    <div className="max-w-full mx-auto flex flex-col gap-4 md:gap-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Konfigurasi Iuran</h1>
          <p className="text-slate-500 text-sm mt-1">Tentukan logika dan variabel untuk siklus penagihan warga.</p>
        </div>
        <Button
          onClick={handleSave}
          isLoading={saving}
          variant="primary"
          size="md"
          icon={Save}
        >
          Simpan Konfigurasi
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: Logic Settings */}
        <div className="lg:col-span-8 flex flex-col gap-10">
          <Card noPadding>
            <CardHeader 
              title="Logika Perhitungan" 
              subtitle="Pilih model matematis utama untuk penagihan"
            />
            
            <div className="p-6 flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button
                  onClick={() => setConfig({ ...config, tipe: "flat" })}
                  className={`p-5 rounded-xl border transition-all text-left flex flex-col gap-4 group relative overflow-hidden ${
                    config.tipe === "flat"
                      ? "border-slate-900 bg-slate-900/5 shadow-sm shadow-slate-100"
                      : "border-slate-100 hover:border-slate-200 hover:bg-slate-50/50"
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 duration-500 ${config.tipe === 'flat' ? 'bg-slate-900 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-400'}`}>
                    <Settings2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-base mb-0.5 tracking-tight">Tarif Flat Tetap</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tagihan Seragam</div>
                  </div>
                  {config.tipe === 'flat' && <div className="absolute top-4 right-4 text-slate-900"><ShieldCheck className="w-4 h-4" /></div>}
                </button>

                <button
                  onClick={() => setConfig({ ...config, tipe: "m2" })}
                  className={`p-5 rounded-xl border transition-all text-left flex flex-col gap-4 group relative overflow-hidden ${
                    config.tipe === "m2"
                      ? "border-slate-900 bg-slate-900/5 shadow-sm shadow-slate-100"
                      : "border-slate-100 hover:border-slate-200 hover:bg-slate-50/50"
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 duration-500 ${config.tipe === 'm2' ? 'bg-slate-900 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-400'}`}>
                    <Calculator className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-base mb-0.5 tracking-tight">Pengali Berbasis Luas</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Dihitung per m²</div>
                  </div>
                  {config.tipe === 'm2' && <div className="absolute top-4 right-4 text-slate-900"><ShieldCheck className="w-4 h-4" /></div>}
                </button>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center text-white">
                      <Zap className="w-3.5 h-3.5" />
                    </div>
                    <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Definisi Parameter</h4>
                  </div>
                  
                  {/* Unique Code Toggle */}
                  <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Kode Unik</span>
                    <button
                      onClick={() => setConfig({ ...config, use_unique_code: !config.use_unique_code })}
                      className={`w-9 h-5 rounded-full transition-all relative ${config.use_unique_code ? 'bg-slate-900' : 'bg-slate-200'}`}
                    >
                      <div className={`absolute top-1 w-3 h-3 rounded-full bg-white shadow-sm transition-all ${config.use_unique_code ? 'right-1' : 'left-1'}`}></div>
                    </button>
                  </div>
                </div>

                <Input
                  label={config.tipe === "flat" ? "Iuran Standar Bulanan (Rp)" : "Tarif per Meter Persegi (Rp/m²)"}
                  type="number"
                  value={config.tarif_dasar}
                  onChange={(e) => setConfig({ ...config, tarif_dasar: parseInt(e.target.value) || 0 })}
                  placeholder="Contoh: 50000"
                  icon={() => <span className="text-xs font-bold text-slate-400">Rp</span>}
                />
              </div>
            </div>
          </Card>

          <Card noPadding>
            <CardHeader 
              title="Tujuan Pembayaran (Manual)" 
              subtitle="Konfigurasi rekening bank dan QRIS untuk transfer manual warga"
            />
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <Input 
                    label="Nama Bank"
                    value={config.rekening_bank}
                    onChange={(e) => setConfig({...config, rekening_bank: e.target.value})}
                    placeholder="misal: Bank Mandiri"
                  />
                  <Input 
                    label="Nomor Rekening"
                    value={config.rekening_no}
                    onChange={(e) => setConfig({...config, rekening_no: e.target.value})}
                    placeholder="misal: 1234567890"
                  />
                  <Input 
                    label="Nama Pemilik Rekening"
                    value={config.rekening_nama}
                    onChange={(e) => setConfig({...config, rekening_nama: e.target.value})}
                    placeholder="misal: Paguyuban Cendana"
                  />
                </div>
                <div className="space-y-6">
                  <div className="relative group">
                    <Input 
                      label="QRIS Image URL"
                      value={config.qris_url}
                      onChange={(e) => setConfig({...config, qris_url: e.target.value})}
                      placeholder="https://..."
                    />
                    <div className="mt-3">
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Atau Upload QRIS Baru</p>
                      <div className="relative h-10">
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={() => {}}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="absolute inset-0 bg-slate-50 rounded-xl border border-dashed border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:bg-slate-100 transition-colors">
                          Pilih File QRIS
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-4 bg-slate-50/50">
                    {config.qris_url ? (
                      <img src={config.qris_url} alt="QRIS Preview" className="max-h-48 rounded-lg shadow-sm" />
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">QRIS Preview</p>
                      </div>
                    )}
                  </div>
                </div>
            </div>
          </Card>


        </div>

        {/* Right: Simulation & Insights */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          <div className="bg-indigo-600 p-6 rounded-2xl text-white shadow-xl shadow-indigo-100 space-y-6 relative overflow-hidden group">
            <div className="absolute -right-10 -top-10 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-700"></div>
            <div className="relative z-10 flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg tracking-tight leading-none">Simulasi</h3>
                <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mt-1">Estimator Tagihan</p>
              </div>
            </div>
            
            <div className="space-y-5 pt-6 border-t border-white/10 relative z-10">
              <div className="flex justify-between items-end">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Contoh Kasus</span>
                  <span className="text-xs font-semibold">Unit Rumah 100m²</span>
                </div>
                <div className="text-xl font-bold tracking-tight">
                  <span className="text-sm font-bold opacity-30 mr-1.5">Rp</span>
                  {config.tipe === "flat" 
                    ? config.tarif_dasar.toLocaleString() 
                    : (config.tarif_dasar * 100).toLocaleString()}
                </div>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                <p className="text-[11px] text-white/50 leading-relaxed font-medium italic">
                  * Variabel sistem diterapkan secara global. Perubahan akan mempengaruhi siklus penagihan berikutnya.
                </p>
              </div>
            </div>
          </div>

          <Card className="group">
            <div className="p-8 space-y-6 text-center">
              <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500 mx-auto transition-transform group-hover:scale-110">
                <Info className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h4 className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">Persyaratan Penting</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  Untuk logika **Berdasarkan Luas**, pastikan semua data luas tanah unit sudah diverifikasi di direktori warga untuk perhitungan yang akurat.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
