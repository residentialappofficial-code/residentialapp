import { useState, useEffect } from "react";
import { Building2, Save, MapPin, Info, ShieldCheck, Globe, Users, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button, Input, Card, CardHeader, Badge, Textarea } from "@/components/ui";

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
    if (e) e.preventDefault();
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
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-6">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Memuat Data HABITIX...</p>
      </div>
    );
  }

  return (
    <div className="max-w-full mx-auto flex flex-col gap-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Profil Komplek</h1>
          <p className="text-slate-500 text-sm mt-1">Konfigurasi entitas dan identitas publik perumahan Anda.</p>
        </div>
        <Button 
          variant="primary" 
          onClick={handleSave} 
          isLoading={saving}
          icon={Save}
          size="lg"
          className="px-12 font-bold rounded-2xl shadow-indigo-200 shadow-xl"
        >
          Simpan Perubahan
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Col: Info Card */}
        <div className="lg:col-span-4 flex flex-col gap-10">
          <Card noPadding className="text-center overflow-hidden !rounded-2xl border-none shadow-xl shadow-slate-200 group">
            <div className="h-32 bg-indigo-50/50 transition-all group-hover:h-36 duration-700 relative overflow-hidden">
               <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500 via-transparent to-transparent"></div>
            </div>
            <div className="relative flex flex-col items-center p-10 -mt-16">
              <div className="w-32 h-32 bg-white p-2 rounded-2xl mb-6 relative z-10 shadow-2xl shadow-slate-950/10 group-hover:scale-105 transition-transform duration-700">
                <div className="w-full h-full bg-slate-50 rounded-2xl flex items-center justify-center text-slate-900">
                  <Building2 className="w-12 h-12" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight leading-none mb-4">{complex.nama}</h3>
              <div className="flex items-center gap-2 px-6 py-2 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                <ShieldCheck className="w-4 h-4" />
                {complex.status || 'Active'}
              </div>
            </div>
          </Card>

          <Card className="!rounded-2xl border-none shadow-xl shadow-slate-200">
            <div className="p-10 flex flex-col gap-10">
              <div className="space-y-8">
                <div className="flex flex-col gap-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Complex ID</p>
                  <p className="text-xs font-mono font-bold text-slate-900 break-all p-3 bg-slate-50 rounded-xl">{selectedPerumahanId}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                   <div className="flex flex-col gap-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Digital Status</p>
                      <HStack gap={2}>
                         <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                         <span className="text-xs font-bold text-slate-900">Online</span>
                      </HStack>
                   </div>
                   <div className="flex flex-col gap-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verified</p>
                      <HStack gap={2}>
                         <CheckCircle2 size={14} className="text-indigo-600" />
                         <span className="text-xs font-bold text-slate-900">Yes</span>
                      </HStack>
                   </div>
                </div>

                <Button 
                   variant="outline" 
                   className="w-full justify-between rounded-xl py-6 font-bold text-xs uppercase tracking-widest text-slate-400 hover:text-slate-900 hover:border-slate-300"
                   iconRight={ArrowUpRight}
                >
                   View Public Page
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Col: Edit Form */}
        <div className="lg:col-span-8">
          <Card hFull noPadding className="border-none shadow-2xl shadow-slate-200">
            <CardHeader title="Informasi Entitas" subtitle="Detail administratif perumahan yang diakui secara sistem" />
            <div className="p-8 md:p-10 space-y-8">
              <div className="grid grid-cols-1 gap-8">
                <Input 
                  label="Nama Resmi Perumahan"
                  value={complex.nama} 
                  onChange={(e) => setComplex({...complex, nama: e.target.value})}
                  placeholder="Contoh: HABITIX Residence..."
                  icon={Building2}
                />

                <Textarea 
                  label="Alamat Operasional & Tagihan"
                  value={complex.alamat}
                  onChange={(e) => setComplex({...complex, alamat: e.target.value})}
                  placeholder="Alamat lengkap komplek..."
                  className="min-h-[160px]"
                />
              </div>

              <div className="pt-10 border-t border-slate-50">
                <div className="bg-indigo-50/30 p-10 rounded-2xl border border-indigo-100 flex gap-8 items-start relative overflow-hidden group">
                  <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000"></div>
                  <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-100 text-white">
                    <Info className="w-7 h-7" />
                  </div>
                  <div className="space-y-1 relative z-10">
                    <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Integritas Data Publik</h4>
                    <p className="text-sm text-indigo-950 font-bold leading-relaxed tracking-tight">
                      Informasi ini bersifat publik. Seluruh warga dan sistem penagihan akan merujuk pada alamat dan nama yang tertera di sini. Harap gunakan data legal yang valid.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function HStack({ children, gap = 2, ...props }) {
  return (
    <div className={`flex items-center gap-${gap}`} {...props}>
      {children}
    </div>
  );
}
