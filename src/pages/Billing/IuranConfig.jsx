import { useState, useEffect } from "react";
import { Save, Info, Settings2, Calculator } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export default function IuranConfig() {
  const { selectedPerumahanId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    tipe: "flat",
    tarif_dasar: 0
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
            tarif_dasar: data.tarif_dasar
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
          tarif_dasar: config.tarif_dasar
        }, { onConflict: 'perumahan_id' });

      if (error) throw error;
      alert("Konfigurasi berhasil disimpan!");
    } catch (err) {
      alert("Gagal menyimpan konfigurasi: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Memuat konfigurasi...</div>;

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Konfigurasi Iuran</h1>
        <p className="text-slate-500 text-sm">Tentukan bagaimana iuran bulanan warga dihitung.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left: Settings */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <Settings2 className="w-5 h-5 text-indigo-600" />
              <h2 className="font-bold text-slate-800">Metode Perhitungan</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setConfig({ ...config, tipe: "flat" })}
                className={`p-4 rounded-xl border-2 transition-all text-left flex flex-col gap-2 ${
                  config.tipe === "flat"
                    ? "border-indigo-600 bg-indigo-50/50"
                    : "border-slate-100 hover:border-slate-200"
                }`}
              >
                <div className="font-bold text-slate-900">Flat Fee</div>
                <div className="text-xs text-slate-500 font-medium">Tarif sama untuk semua rumah tanpa memandang ukuran.</div>
              </button>

              <button
                onClick={() => setConfig({ ...config, tipe: "m2" })}
                className={`p-4 rounded-xl border-2 transition-all text-left flex flex-col gap-2 ${
                  config.tipe === "m2"
                    ? "border-indigo-600 bg-indigo-50/50"
                    : "border-slate-100 hover:border-slate-200"
                }`}
              >
                <div className="font-bold text-slate-900">Berdasarkan Luas (m²)</div>
                <div className="text-xs text-slate-500 font-medium">Tarif dikalikan dengan luas tanah masing-masing warga.</div>
              </button>
            </div>

            <div className="space-y-2 pt-4">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {config.tipe === "flat" ? "Tarif Per Bulan (Rp)" : "Tarif Per m² (Rp)"}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-slate-400 font-bold text-sm">Rp</span>
                </div>
                <input
                  type="number"
                  value={config.tarif_dasar}
                  onChange={(e) => setConfig({ ...config, tarif_dasar: parseInt(e.target.value) || 0 })}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition-all"
                />
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? "Menyimpan..." : "Simpan Konfigurasi"}
            </button>
          </div>
        </div>

        {/* Right: Info/Preview */}
        <div className="space-y-6">
          <div className="bg-indigo-600 p-6 rounded-2xl text-white shadow-xl shadow-indigo-100 space-y-4">
            <Calculator className="w-8 h-8 opacity-50" />
            <h3 className="font-bold text-lg">Simulasi Tagihan</h3>
            <div className="space-y-3 pt-2">
              <div className="flex justify-between text-sm opacity-80">
                <span>Contoh Rumah (100m²)</span>
                <span>Estimasi</span>
              </div>
              <div className="text-2xl font-bold">
                Rp {config.tipe === "flat" 
                  ? config.tarif_dasar.toLocaleString() 
                  : (config.tarif_dasar * 100).toLocaleString()}
              </div>
              <p className="text-[10px] opacity-70 leading-relaxed italic">
                *Tagihan final akan dihitung otomatis saat Anda melakukan "Generate Tagihan" di setiap awal bulan.
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 text-amber-600">
              <Info className="w-4 h-4" />
              <h4 className="text-xs font-bold uppercase tracking-wider">Penting</h4>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Jika Anda memilih metode **Berdasarkan Luas (m²)**, pastikan data **Luas Tanah** di setiap Profil Warga sudah diisi dengan benar agar perhitungan akurat.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
