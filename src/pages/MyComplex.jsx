import { useState, useEffect } from "react";
import { Building2, Save, MapPin, Globe, Phone, Info, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button, Input, Card, CardHeader, Badge } from "@/components/ui";

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
   <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
    <div className="w-10 h-10 border-4 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
    <p className="text-xs font-bold text-slate-400 ">Memuat Data Komplek...</p>
   </div>
  );
 }

 return (
  <div className="max-w-full mx-auto flex flex-col gap-6">
   <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
    <div>
     <h1 className="text-xl font-bold text-slate-900 tracking-tight">Profil Komplek</h1>
     <p className="text-slate-500 text-sm font-medium">Kelola informasi publik dan identitas perumahan Anda.</p>
    </div>
    <Button 
     variant="primary" 
     onClick={handleSave} 
     isLoading={saving}
     icon={Save}
     size="lg"
    >
     Simpan Perubahan
    </Button>
   </div>

   <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
    {/* Left Col: Info Card */}
    <div className="lg:col-span-4 flex flex-col gap-8">
     <Card className="text-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-24 bg-slate-950"></div>
      <div className="relative flex flex-col items-center">
       <div className="w-28 h-28 bg-white p-1 rounded-xl  mb-6 relative z-10">
        <div className="w-full h-full bg-slate-100 rounded-lg flex items-center justify-center text-slate-950">
         <Building2 className="w-10 h-10" />
        </div>
       </div>
       <h3 className="text-xl font-bold text-slate-900 tracking-tight">{complex.nama}</h3>
       <div className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-green-50 text-green-600 rounded-full text-xs font-bold ">
        <CheckCircle2 className="w-3 h-3" /> {complex.status}
       </div>
      </div>
     </Card>

     <Card>
      <div className="p-8 flex flex-col gap-6">
       <div className="space-y-4">
        <div className="flex flex-col gap-1">
         <p className="text-xs font-bold text-slate-400 ">Komplek ID</p>
         <p className="text-xs font-bold text-slate-900 break-all">{selectedPerumahanId}</p>
        </div>
        <div className="h-px bg-slate-50"></div>
        <div className="flex flex-col gap-1">
         <p className="text-xs font-bold text-slate-400 ">Tanggal Bergabung</p>
         <p className="text-xs font-bold text-slate-900">01 Januari 2024</p>
        </div>
       </div>
      </div>
     </Card>
    </div>

    {/* Right Col: Edit Form */}
    <div className="lg:col-span-8">
     <Card hFull>
      <CardHeader title="Pengaturan Identitas" subtitle="Informasi publik perumahan" />
      <div className="p-8 space-y-8">
       <div className="grid grid-cols-1 gap-8">
        <Input 
         label="Nama Perumahan"
         value={complex.nama} 
         onChange={(e) => setComplex({...complex, nama: e.target.value})}
         placeholder="Nama Komplek..."
         icon={Building2}
        />

        <div className="flex flex-col gap-2">
         <label className="text-xs font-bold text-slate-400 ">Alamat Lengkap</label>
         <div className="relative group">
          <textarea
           value={complex.alamat}
           onChange={(e) => setComplex({...complex, alamat: e.target.value})}
           className="w-full px-5 py-2.5 pl-14 bg-slate-50 border border-slate-100 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-950/5 focus:border-slate-950 outline-none transition-all min-h-[150px] placeholder:text-slate-300 group-hover:border-slate-200"
           placeholder="Alamat lengkap komplek..."
          />
          <MapPin className="w-5 h-5 text-slate-300 absolute left-5 top-5 group-hover:text-slate-400 transition-colors" />
         </div>
        </div>
       </div>

       <div className="pt-8 border-t border-slate-50">
        <div className="bg-amber-50 p-6 rounded-xl border border-amber-100 flex gap-4">
         <div className="w-10 h-10 bg-amber-100 rounded-2xl flex items-center justify-center shadow-[0_1px_2px_rgba(0,0,0,0.03)] shrink-0  shadow-amber-200/50">
          <Info className="w-5 h-5 text-amber-600" />
         </div>
         <div className="space-y-1">
          <h4 className="text-xs font-bold text-amber-700 ">Informasi Publik</h4>
          <p className="text-xs text-amber-800 font-bold leading-relaxed">
           Informasi ini akan ditampilkan pada halaman publik dan tagihan warga. Pastikan data yang dimasukkan sudah benar.
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
