import { useState, useEffect } from "react";
import { Building2, Save, MapPin, Globe, Phone, Info } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button, Input, Card, CardHeader } from "@/components/ui";

export default function MyComplex() {
  const { selectedPerumahanId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [complex, setComplex] = useState({
    nama: "",
    alamat: "",
    status: "active"
  });

  useEffect(() => {
    async function fetchComplexData() {
      if (!selectedPerumahanId) return;
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('perumahan')
          .select('*')
          .eq('id', selectedPerumahanId)
          .single();

        if (error) throw error;
        if (data) setComplex(data);
      } catch (error) {
        console.error("Gagal memuat data komplek:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchComplexData();
  }, [selectedPerumahanId]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase
        .from('perumahan')
        .update({
          nama: complex.nama,
          alamat: complex.alamat
        })
        .eq('id', selectedPerumahanId);

      if (error) throw error;
      alert("Data komplek berhasil diperbarui!");
    } catch (error) {
      alert("Gagal menyimpan: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Profil Komplek</h1>
        <p className="text-slate-500 text-sm font-medium">Kelola informasi publik dan identitas perumahan Anda.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Col: Info Card */}
        <div className="md:col-span-1">
          <Card className="text-center py-8">
            <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mx-auto mb-4">
              <Building2 className="w-10 h-10" />
            </div>
            <h3 className="font-bold text-slate-900">{complex.nama}</h3>
            <p className="text-xs text-slate-400 mt-1 uppercase font-bold tracking-widest italic">{complex.status}</p>
          </Card>
        </div>

        {/* Right Col: Edit Form */}
        <div className="md:col-span-2">
          <Card noPadding>
            <CardHeader title="Pengaturan Identitas" />
            <form onSubmit={handleSave} className="p-6 flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nama Perumahan</label>
                <div className="relative">
                  <Input 
                    value={complex.nama} 
                    onChange={(e) => setComplex({...complex, nama: e.target.value})}
                    placeholder="Nama Komplek..."
                    className="pl-10"
                  />
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Alamat Lengkap</label>
                <div className="relative flex items-start">
                  <textarea
                    value={complex.alamat}
                    onChange={(e) => setComplex({...complex, alamat: e.target.value})}
                    className="w-full px-4 py-3 pl-10 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all font-medium min-h-[100px]"
                    placeholder="Alamat lengkap..."
                  />
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              <div className="flex justify-end mt-4">
                <Button 
                  type="submit" 
                  variant="primary" 
                  disabled={saving}
                  icon={Save}
                  className="px-8"
                >
                  {saving ? "Menyimpan..." : "Simpan Perubahan"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
