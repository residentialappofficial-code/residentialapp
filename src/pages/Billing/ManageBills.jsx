import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Filter, CheckCircle, Clock, AlertCircle, FileText, Send, Trash2, Layers, Sparkles, Receipt } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button, Input, Card, CardHeader, Table, THead, TBody, TR, TH, TD, Badge } from "@/components/ui";

export default function ManageBills() {
 const { selectedPerumahanId } = useAuth();
 const [loading, setLoading] = useState(true);
 const [data, setData] = useState([]);
 const [generating, setGenerating] = useState(false);
 const [searchTerm, setSearchTerm] = useState("");
 
 const currentMonth = new Date().getMonth() + 1;
 const currentYear = new Date().getFullYear();

 const fetchBills = useCallback(async () => {
  if (!selectedPerumahanId) return;
  try {
   setLoading(true);
   const { data: bills, error } = await supabase
    .from("tagihan")
    .select(`
     *,
     warga:warga_id(nama, blok)
    `)
    .eq("perumahan_id", selectedPerumahanId)
    .order("created_at", { ascending: false });

   if (error) throw error;
   setData(bills || []);
  } catch (err) {
   console.error("Error fetching bills:", err);
  } finally {
   setLoading(false);
  }
 }, [selectedPerumahanId]);

 useEffect(() => {
  fetchBills();
 }, [fetchBills]);

 const handleGenerateBills = async () => {
  if (!window.confirm(`Generate tagihan untuk semua warga untuk bulan ${currentMonth}/${currentYear}?`)) return;
  
  setGenerating(true);
  try {
   const { data: config, error: configError } = await supabase
    .from("iuran_config")
    .select("*")
    .eq("perumahan_id", selectedPerumahanId)
    .maybeSingle();

   if (!config) throw new Error("Konfigurasi iuran belum diatur. Silakan atur di menu Iuran Config.");
   if (configError) throw configError;

   const { data: warga, error: wargaError } = await supabase
    .from("warga")
    .select("id, luas_tanah")
    .eq("perumahan_id", selectedPerumahanId)
    .eq("status_aktif", true);

   if (wargaError) throw wargaError;
   if (!warga || warga.length === 0) throw new Error("Tidak ada warga aktif untuk diberikan tagihan.");

   const newBills = warga.map(w => {
    const jumlah = config.tipe === "flat" 
     ? config.tarif_dasar 
     : (config.tarif_dasar * (w.luas_tanah || 0));
    
    return {
     warga_id: w.id,
     perumahan_id: selectedPerumahanId,
     bulan: currentMonth,
     tahun: currentYear,
     jumlah: jumlah,
     status: "Unpaid", unique_code: Math.floor(Math.random() * 999) + 1
    };
   });

   const { error: insertError } = await supabase
    .from("tagihan")
    .insert(newBills);

   if (insertError) throw insertError;
   fetchBills();
  } catch (err) {
   alert("Gagal generate tagihan: " + err.message);
  } finally {
   setGenerating(false);
  }
 };

 const handleDeleteBill = async (id) => {
  if (!window.confirm("Hapus tagihan ini secara permanen?")) return;
  try {
   const { error } = await supabase.from("tagihan").delete().eq("id", id);
   if (error) throw error;
   fetchBills();
  } catch (err) {
   alert("Gagal menghapus: " + err.message);
  }
 };

 const filteredData = data.filter(item => 
  item.warga?.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  item.warga?.blok?.toLowerCase().includes(searchTerm.toLowerCase())
 );

 return (
  <div className="flex flex-col gap-6">
   {/* Header */}
   <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
    <div>
     <h1 className="text-xl font-bold text-slate-900 tracking-tight">Billing Management</h1>
     <p className="text-slate-500 text-sm font-medium">Generate and monitor monthly residential fee distribution.</p>
    </div>
    <Button
     onClick={handleGenerateBills}
     isLoading={generating}
     variant="primary"
     icon={Sparkles}
     size="lg"
     className="px-10  shadow-none"
    >
     {generating ? "Computing..." : `Generate Cycle ${currentMonth}/${currentYear}`}
    </Button>
   </div>

   <Card noPadding>
    <CardHeader 
     title="Billing Directory" 
     subtitle="Comprehensive log of issued residential invoices"
     action={
      <div className="flex gap-4">
       <Input 
        placeholder="Search unit or resident..." 
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        icon={Search}
        className="w-80"
       />
       <Button variant="ghost" size="sm" icon={Filter} className="text-slate-400 font-bold">Filter</Button>
      </div>
     }
    />

    <Table>
     <THead>
      <TR isHeader>
       <TH>Resident & Unit</TH>
       <TH>Cycle Period</TH>
       <TH textAlign="right">Total Due</TH>
       <TH>Status</TH>
       <TH textAlign="right">Actions</TH>
      </TR>
     </THead>
     <TBody>
      {loading ? (
       Array(6).fill(0).map((_, i) => (
        <TR key={i}><TD colSpan={5}><div className="h-12 bg-slate-50 rounded-xl animate-pulse"></div></TD></TR>
       ))
      ) : filteredData.length === 0 ? (
       <TR><TD colSpan={5} textAlign="center" className="py-24 text-xs font-bold tracking-[0.3em] text-slate-400">No invoices generated for this cycle.</TD></TR>
      ) : filteredData.map((item) => (
       <TR key={item.id} className="group">
        <TD>
         <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-slate-950 rounded-2xl flex items-center justify-center shadow-[0_1px_2px_rgba(0,0,0,0.03)] text-white   shadow-none transition-transform group-hover:scale-110">
           {item.warga?.nama?.charAt(0) || "?"}
          </div>
          <div className="flex flex-col">
           <p className="text-sm font-bold text-slate-900 tracking-tight">{item.warga?.nama}</p>
           <p className="text-xs font-bold text-slate-400 ">{item.warga?.blok}</p>
          </div>
         </div>
        </TD>
        <TD className="text-slate-500  ">
         Period {item.bulan} • {item.tahun}
        </TD>
        <TD className="text-slate-900 font-bold text-right tracking-tight">
         Rp {item.jumlah?.toLocaleString()}
        </TD>
        <TD>
         <Badge variant={
          item.status === 'Paid' ? 'green' : 
          item.status === 'Pending' ? 'orange' : 'slate'
         }>
          {item.status}
         </Badge>
        </TD>
        <TD textAlign="right">
         <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" icon={Receipt} className="text-slate-400 hover:text-slate-950" />
          <Button variant="ghost" size="sm" icon={Send} className="text-slate-400 hover:text-blue-600" />
          <Button variant="ghost" size="sm" icon={Trash2} className="text-slate-400 hover:text-red-500" onClick={() => handleDeleteBill(item.id)} />
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
