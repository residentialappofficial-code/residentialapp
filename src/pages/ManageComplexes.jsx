import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Building2, ShieldCheck, Users, Search, MoreHorizontal, Filter, MapPin, Layers, CheckCircle, Ban, ArrowUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button, Input, Card, CardHeader, Badge, Table, THead, TBody, TR, TH, TD } from "@/components/ui";

const ComplexStatCard = ({ title, value, icon: Icon, color = "slate" }) => {
  const colors = {
    slate: "bg-slate-950 text-white border border-slate-900 shadow-none",
    blue: "bg-blue-50 text-blue-600 border border-blue-100 shadow-none",
    green: "bg-green-50 text-green-600 border border-green-100 shadow-none",
    red: "bg-red-50 text-red-600 border border-red-100 shadow-none",
  };

  return (
    <Card className="relative overflow-hidden group">
      <div className="flex flex-col gap-8">
        <div className="flex justify-between items-start">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-[0_1px_2px_rgba(0,0,0,0.03)] ${colors[color]}  transition-transform group-hover:scale-110 duration-300`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
        
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-slate-900 tracking-tighter">{value}</h3>
          <p className="text-xs font-bold text-slate-400">{title}</p>
        </div>
      </div>
      <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-slate-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
    </Card>
  );
};

export default function ManageComplexes() {
 const { switchPerumahan, selectedPerumahanId } = useAuth();
 const [complexes, setComplexes] = useState([]);
 const [loading, setLoading] = useState(true);
 const [searchTerm, setSearchTerm] = useState("");

 const fetchComplexes = useCallback(async () => {
  try {
   setLoading(true);
   const { data, error } = await supabase
    .from('perumahan')
    .select(`
     *,
     warga_count:warga(count)
    `);
   
   if (error) throw error;
   setComplexes(data || []);
  } catch (error) {
   console.error("Gagal memuat data", error.message);
  } finally {
   setLoading(false);
  }
 }, []);

 useEffect(() => {
  fetchComplexes();
 }, [fetchComplexes]);

 const toggleSuspend = async (id, currentStatus) => {
  const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
  try {
   const { error } = await supabase
    .from('perumahan')
    .update({ status: newStatus })
    .eq('id', id);
   
   if (error) throw error;
   fetchComplexes();
  } catch (error) {
   alert("Gagal mengubah status: " + error.message);
  }
 };

 const filteredData = complexes.filter(item => 
  item.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  item.alamat?.toLowerCase().includes(searchTerm.toLowerCase())
 );

 return (
  <div className="flex flex-col gap-8">
   {/* Header */}
   <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
    <div>
     <h1 className="text-xl font-bold text-slate-900 tracking-tight">Kelola Komplek</h1>
     <p className="text-slate-500 text-sm font-medium">Manajemen seluruh perumahan dan kontrol akses sistem.</p>
    </div>
    <Button variant="primary" icon={Plus} size="lg">Tambah Komplek Baru</Button>
   </div>

   {/* Stats Grid */}
   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    <ComplexStatCard title="Total Perumahan" value={complexes.length.toString()} icon={Building2} color="blue" />
    <ComplexStatCard title="Komplek Aktif" value={complexes.filter(c => c.status !== 'suspended').length.toString()} icon={ShieldCheck} color="green" />
    <ComplexStatCard title="Komplek Suspended" value={complexes.filter(c => c.status === 'suspended').length.toString()} icon={Ban} color="red" />
   </div>

   {/* Table Card */}
   <Card noPadding>
    <CardHeader 
     title="Daftar Perumahan"
     subtitle="Database infrastruktur SimPerumahan"
     action={
      <div className="flex gap-4">
       <Input 
        placeholder="Cari perumahan..." 
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        icon={Search}
        className="w-80"
       />
       <Button variant="ghost" icon={Filter} size="sm" />
      </div>
     }
    />

    <Table>
     <THead>
      <TR isHeader>
       <TH>Nama Perumahan</TH>
       <TH>Lokasi & Alamat</TH>
       <TH>Unit Terdaftar</TH>
       <TH>Status Sistem</TH>
       <TH textAlign="right">Aksi Manajemen</TH>
      </TR>
     </THead>
     <TBody>
      {loading ? (
       Array(3).fill(0).map((_, i) => (
        <TR key={i}><TD colSpan={5}><div className="h-10 bg-slate-50 rounded-xl animate-pulse"></div></TD></TR>
       ))
      ) : filteredData.length === 0 ? (
       <TR>
        <TD colSpan={5} textAlign="center" className="py-20 text-slate-400 font-bold  text-xs">Tidak ada data perumahan.</TD>
       </TR>
      ) : filteredData.map((item) => (
       <TR key={item.id} className={`${selectedPerumahanId === item.id ? 'bg-slate-50/50' : ''} group`}>
        <TD>
         <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-[0_1px_2px_rgba(0,0,0,0.03)]  transition-transform group-hover:scale-110 ${item.status === 'suspended' ? 'bg-slate-100 text-slate-400' : 'bg-slate-950 text-white border border-slate-900'}`}>
           <Building2 className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
           <span className={`text-sm font-bold tracking-tight ${item.status === 'suspended' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
            {item.nama}
           </span>
           <span className="text-xs font-bold text-slate-400 ">ID: {item.id.substring(0, 8)}</span>
          </div>
         </div>
        </TD>
        <TD>
         <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-50 rounded-lg">
           <MapPin className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <span className="text-xs text-slate-600 font-bold leading-relaxed max-w-full[200px] line-clamp-1">{item.alamat || "Alamat belum diatur"}</span>
         </div>
        </TD>
        <TD>
         <div className="flex items-center gap-2">
          <Badge variant="slate" className="px-5 py-2.5">{item.warga_count?.[0]?.count || 0} Unit</Badge>
         </div>
        </TD>
        <TD>
         <Badge variant={item.status === 'suspended' ? 'red' : 'green'} className="font-bold">
          {item.status?.toUpperCase() || 'ACTIVE'}
         </Badge>
        </TD>
        <TD textAlign="right">
         <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button 
           size="sm" 
           variant={selectedPerumahanId === item.id ? 'primary' : 'outline'}
           onClick={() => switchPerumahan(item.id)}
           disabled={item.status === 'suspended'}
          >
           {selectedPerumahanId === item.id ? 'Selected' : 'Select'}
          </Button>
          <Button 
           size="sm" 
           variant={item.status === 'suspended' ? 'success' : 'danger'}
           onClick={() => toggleSuspend(item.id, item.status)}
           icon={item.status === 'suspended' ? CheckCircle : Ban}
          >
           {item.status === 'suspended' ? 'Activate' : 'Suspend'}
          </Button>
         </div>
        </TD>
       </TR>
      ))}
     </TBody>
    </Table>
   </Card>
  </div>
 );
}
