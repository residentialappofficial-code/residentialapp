import { useState, useEffect } from "react";
import { Save, Zap, Server } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button, Input, Card, CardHeader } from "@/components/ui";

export default function SystemSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    pakasir_slug: "",
    pakasir_api_key: ""
  });

  useEffect(() => {
    async function fetchConfig() {
      try {
        const { data } = await supabase
          .from("system_settings")
          .select("*")
          .in('key', ['pakasir_slug', 'pakasir_api_key']);

        if (data && data.length > 0) {
          const newConfig = { ...config };
          data.forEach(item => {
            newConfig[item.key] = item.value;
          });
          setConfig(newConfig);
        }
      } catch (err) {
        console.error("Error fetching system settings:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchConfig();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = [
        { key: 'pakasir_slug', value: config.pakasir_slug, description: 'Slug for Pakasir integration (Global)' },
        { key: 'pakasir_api_key', value: config.pakasir_api_key, description: 'API Key for Pakasir integration (Global)' }
      ];

      const { error } = await supabase
        .from("system_settings")
        .upsert(updates, { onConflict: 'key' });

      if (error) throw error;
      alert("Konfigurasi sistem berhasil disimpan!");
    } catch (err) {
      alert("Gagal menyimpan konfigurasi: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="p-32 text-center">
      <div className="w-12 h-12 bg-slate-50 rounded-2xl mx-auto mb-8 animate-pulse"></div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Memuat Pengaturan...</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-4 md:gap-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sistem & Integrasi</h1>
            <p className="text-slate-500 text-sm mt-1">Pengaturan global sistem dan integrasi pihak ketiga.</p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          isLoading={saving}
          variant="primary"
          size="md"
          icon={Save}
        >
          Simpan Perubahan
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-10">
        <Card noPadding>
          <CardHeader 
            title="Integrasi Pakasir (Global)" 
            subtitle="Hubungkan ke Pakasir untuk pembayaran QRIS otomatis (Berlaku untuk semua perumahan)"
          />
          <div className="p-6 flex flex-col gap-6">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col md:flex-row gap-5 items-start md:items-center relative overflow-hidden group">
              <div className="w-12 h-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center shrink-0 shadow-sm relative z-10">
                <Zap className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="space-y-1 relative z-10">
                <h4 className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Global Payment Gateway</h4>
                <p className="text-sm text-slate-600 font-semibold leading-relaxed tracking-tight">
                  Gunakan integrasi ini untuk mengaktifkan pembayaran otomatis via QRIS. Konfigurasi ini adalah master untuk seluruh sistem.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input 
                label="Slug Proyek Pakasir"
                value={config.pakasir_slug}
                onChange={(e) => setConfig({...config, pakasir_slug: e.target.value})}
                placeholder="Contoh: perumahancendana"
              />
              <Input 
                label="Pakasir API Key"
                type="password"
                value={config.pakasir_api_key}
                onChange={(e) => setConfig({...config, pakasir_api_key: e.target.value})}
                placeholder="PAKASIR_API_..."
              />
            </div>
            
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Webhook URL</p>
              <div className="flex items-center gap-3">
                <code className="text-xs font-mono bg-white px-4 py-2.5 rounded-lg border border-slate-200 flex-1 text-slate-600">
                  {window.location.origin}/api/webhooks/pakasir
                </code>
                <Button variant="ghost" size="sm" onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/api/webhooks/pakasir`);
                  alert("Webhook URL dicopy!");
                }} className="text-indigo-600 font-black">Copy</Button>
              </div>
              <p className="text-[10px] font-bold text-slate-400 mt-3 italic">* Masukkan URL ini di pengaturan webhook proyek Pakasir Anda.</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
