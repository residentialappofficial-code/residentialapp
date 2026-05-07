import { useState, useEffect, useCallback } from "react";
import { Search, Edit, Trash2, Download, UserPlus, X, UserMinus, Users, Home, Map, Database, ArrowRight, ShieldCheck, UserCircle, Building2, Mail, Phone } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button, Input, Card, CardHeader, Badge, Table, THead, TBody, TR, TH, TD, Modal, Select } from "@/components/ui";
import { SelectionRequired } from "@/components/ui/SelectionRequired";

const ResidentStatCard = ({ title, value, icon: Icon, color = "slate" }) => {
  const colors = {
    slate: "bg-slate-950 text-white border border-slate-900 shadow-none",
    blue: "bg-blue-50 text-blue-600 border border-blue-100 shadow-none",
    green: "bg-green-50 text-green-600 border border-green-100 shadow-none",
    amber: "bg-amber-50 text-amber-600 border border-amber-100 shadow-none",
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

export default function DataWarga() {
 const { selectedPerumahanId, profile } = useAuth();
 const [data, setData] = useState([]);
 const [loading, setLoading] = useState(true);
 const [searchTerm, setSearchTerm] = useState("");
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [isEditMode, setIsEditMode] = useState(false);
 const [editingId, setEditingId] = useState(null);

 const [formData, setFormData] = useState({
  nama: "",
  blok: "",
  no_hp: "",
  email: "",
  status_hunian: "Pemilik",
  luas_tanah: 0
 });

 const fetchData = useCallback(async (search = "") => {
  try {
   setLoading(true);
   if (!selectedPerumahanId) return;

   let query = supabase.from('warga')
    .select('*')
    .eq('perumahan_id', selectedPerumahanId)
    .order('nama', { ascending: true });
   
   if (search) {
    query = query.or(`nama.ilike.%${search}%,blok.ilike.%${search}%`);
   }

   const { data: residents, error } = await query;
   if (error) throw error;
   setData(residents || []);
  } catch (error) {
   console.error("Error fetching data:", error);
  } finally {
   setLoading(false);
  }
 }, [selectedPerumahanId]);

 useEffect(() => {
  if (selectedPerumahanId) {
   fetchData(searchTerm);
  }
 }, [selectedPerumahanId, searchTerm, fetchData]);

 const handleDeleteWarga = async (id) => {
  if (!window.confirm("Delete this resident record permanently?")) return;
  try {
   const { error } = await supabase.from('warga').delete().eq('id', id);
   if (error) throw error;
   fetchData(searchTerm);
  } catch (err) {
   alert("Delete failed: " + err.message);
  }
 };

 const handleEdit = (item) => {
  setEditingId(item.id);
  setFormData({
   nama: item.nama || "",
   blok: item.blok || "",
   no_hp: item.no_hp || "",
   email: item.email || "",
   status_hunian: item.status_hunian || "Pemilik",
   luas_tanah: item.luas_tanah || 0
  });
  setIsEditMode(true);
  setIsModalOpen(true);
 };

 const handleAddWarga = async (e) => {
  if (e) e.preventDefault();
  if (!selectedPerumahanId) return;
  
  setIsSubmitting(true);
  try {
   if (isEditMode) {
    const { error } = await supabase
     .from('warga')
     .update(formData)
     .eq('id', editingId);
    if (error) throw error;
   } else {
    const { error } = await supabase
     .from('warga')
     .insert({
      ...formData,
      perumahan_id: selectedPerumahanId,
      status_iuran: 'Belum Lunas'
     });
    if (error) throw error;
   }
   
   setIsModalOpen(false);
   setIsEditMode(false);
   setEditingId(null);
   setFormData({ nama: "", blok: "", no_hp: "", email: "", status_hunian: "Pemilik", luas_tanah: 0 });
   fetchData(searchTerm);
  } catch (error) {
   alert("Submission failed: " + error.message);
  } finally {
   setIsSubmitting(false);
  }
 };

 const handleMutation = async (wargaId) => {
  if (!window.confirm("Process mutation/move-out for this resident? The account will be deactivated.")) return;
  
  try {
   const { data: bills, error: billError } = await supabase
    .from('tagihan')
    .select('id')
    .eq('warga_id', wargaId)
    .eq('status', 'Unpaid');
   
   if (billError) throw billError;
   
   if (bills && bills.length > 0) {
    alert(`Mutation Failed: Resident has ${bills.length} unpaid invoices.`);
    return;
   }

   const { error: updateError } = await supabase
    .from('warga')
    .update({ status_aktif: false })
    .eq('id', wargaId);
   
   if (updateError) throw updateError;
   fetchData(searchTerm);
  } catch (err) {
   alert("Mutation Error: " + err.message);
  }
 };

 if (profile?.role === 'super_admin' && !selectedPerumahanId) {
  return <SelectionRequired />;
 }

 return (
  <div className="flex flex-col gap-6">
   {/* Page Header */}
   <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
    <div>
     <h1 className="text-xl font-bold text-slate-900 tracking-tight">Resident Database</h1>
     <p className="text-slate-500 text-sm font-medium">Manage unit identifiers, occupancy status, and land metrics.</p>
    </div>
    <div className="flex items-center gap-4">
     <Button variant="ghost" icon={Download} className="text-slate-400 font-bold hover:bg-slate-50">Export Dataset</Button>
     <Button variant="primary" size="lg" icon={UserPlus} className="px-10  shadow-none" onClick={() => {
      setIsEditMode(false);
      setEditingId(null);
      setFormData({ nama: "", blok: "", no_hp: "", email: "", status_hunian: "Pemilik", luas_tanah: 0 });
      setIsModalOpen(true);
     }}>Add Resident</Button>
    </div>
   </div>

   {/* Stats Summary */}
   <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
    <ResidentStatCard title="Total Registry" value={data.length} icon={Users} color="slate" />
    <ResidentStatCard title="Primary Owners" value={data.filter(w => w.status_hunian === 'Pemilik').length} icon={Home} color="blue" />
    <ResidentStatCard title="Rental Units" value={data.filter(w => w.status_hunian === 'Kontrak').length} icon={Users} color="amber" />
    <ResidentStatCard title="Aggregated Area" value={`${data.reduce((acc, curr) => acc + (curr.luas_tanah || 0), 0)} m²`} icon={Map} color="green" />
   </div>

   {/* Data Card */}
   <Card noPadding>
    <CardHeader 
     title="Unit Registry" 
     subtitle="Comprehensive administrative database of all complex residents"
     action={
      <div className="flex gap-4">
       <Input 
        placeholder="Search name or unit identifier..." 
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        icon={Search}
        className="w-80"
       />
       <Button variant="ghost" icon={Database} size="sm" className="text-slate-400" />
      </div>
     }
    />

    <Table>
     <THead>
      <TR isHeader>
       <TH>Resident Identity</TH>
       <TH>Block / Unit</TH>
       <TH>Land Area</TH>
       <TH>Contact Details</TH>
       <TH>Occupancy</TH>
       <TH>Billing Status</TH>
       <TH textAlign="right">Actions</TH>
      </TR>
     </THead>
     <TBody>
      {loading ? (
       Array(6).fill(0).map((_, i) => (
        <TR key={i}><TD colSpan={7}><div className="h-12 bg-slate-50 rounded-xl animate-pulse"></div></TD></TR>
       ))
      ) : data.length === 0 ? (
       <TR><TD colSpan={7} textAlign="center" className="py-24 text-xs font-bold tracking-[0.3em] text-slate-400">Database is empty. No resident records found.</TD></TR>
      ) : data.map((item) => (
       <TR key={item.id} className="group">
        <TD>
         <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center shadow-[0_1px_2px_rgba(0,0,0,0.03)] text-white  shadow-none transition-transform group-hover:scale-110 duration-500">
           <span className="font-bold text-sm ">{item.nama?.charAt(0) || "?"}</span>
          </div>
          <div className="flex flex-col">
           <p className="text-sm font-bold text-slate-900 tracking-tight">{item.nama}</p>
           <p className="text-[9px] text-slate-400 font-bold ">UID: {item.id.slice(0, 8)}</p>
          </div>
         </div>
        </TD>
        <TD className="text-slate-900 font-bold text-sm tracking-tight">{item.blok}</TD>
        <TD className="text-slate-900 font-bold text-sm tracking-tight">{item.luas_tanah || 0} m²</TD>
        <TD className="text-slate-500 ">{item.no_hp || "-"}</TD>
        <TD>
         <Badge variant={item.status_hunian === 'Pemilik' ? 'blue' : 'indigo'} className="font-bold">
          {item.status_hunian?.toUpperCase()}
         </Badge>
        </TD>
        <TD>
         <Badge variant={item.status_iuran === 'Lunas' ? 'green' : 'red'} className="font-bold">
          {item.status_iuran === 'Lunas' ? 'PAID' : 'OVERDUE'}
         </Badge>
        </TD>
        <TD textAlign="right">
         <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" icon={Edit} onClick={() => handleEdit(item)} className="text-slate-400 hover:text-slate-950" />
          <Button variant="ghost" size="sm" icon={UserMinus} onClick={() => handleMutation(item.id)} className="text-slate-400 hover:text-amber-600" title="Resident Mutation" />
          <Button variant="ghost" size="sm" icon={Trash2} onClick={() => handleDeleteWarga(item.id)} className="text-slate-300 hover:text-red-500" title="Delete Permanently" />
         </div>
        </TD>
       </TR>
      ))}
     </TBody>
    </Table>

    {/* Pagination Footer */}
    <div className="px-10 py-3 bg-slate-50/50 flex justify-between items-center border-t border-slate-100/50">
     <p className="text-xs font-bold text-slate-400 ">Active Database Index: {data.length} Total Entries</p>
     <div className="flex gap-3">
      <Button variant="ghost" size="sm" disabled className="px-6 font-bold  text-[9px] text-slate-400">Previous</Button>
      <div className="flex gap-2">
       <Button variant="primary" size="sm" className="w-10 h-10 rounded-xl  shadow-none">1</Button>
      </div>
      <Button variant="ghost" size="sm" disabled className="px-6 font-bold  text-[9px] text-slate-400">Next</Button>
     </div>
    </div>
   </Card>

   {/* Add/Edit Resident Modal */}
   <Modal 
    isOpen={isModalOpen} 
    onClose={() => setIsModalOpen(false)} 
    title={isEditMode ? "Modify Resident Data" : "New Resident Onboarding"}
   >
    <div className="space-y-10 p-2">
     <div className="flex items-center gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
      <div className="w-10 h-10 bg-slate-950 rounded-2xl flex items-center justify-center shadow-[0_1px_2px_rgba(0,0,0,0.03)] text-white ">
       <ShieldCheck className="w-5 h-5" />
      </div>
      <p className="text-xs text-slate-500 font-bold leading-relaxed">Ensure all identifier data matches legal unit documentation for billing accuracy.</p>
     </div>

     <div className="grid grid-cols-2 gap-8">
      <Input 
       label="Legal Full Name"
       required 
       value={formData.nama} 
       onChange={(e) => setFormData({...formData, nama: e.target.value})}
       placeholder="e.g. John Doe"
       icon={UserCircle}
      />
      <Input 
       label="Block / Unit Number"
       required 
       value={formData.blok} 
       onChange={(e) => setFormData({...formData, blok: e.target.value})}
       placeholder="e.g. A-12"
       icon={Building2}
      />
     </div>

     <div className="grid grid-cols-2 gap-8">
      <Input 
       label="Administrative Email"
       type="email"
       value={formData.email} 
       onChange={(e) => setFormData({...formData, email: e.target.value})}
       placeholder="resident@complex.com"
       icon={Mail}
      />
      <Input 
       label="WhatsApp / Contact"
       value={formData.no_hp} 
       onChange={(e) => setFormData({...formData, no_hp: e.target.value})}
       placeholder="0812..."
       icon={Phone}
      />
     </div>

     <div className="grid grid-cols-2 gap-8">
      <div className="flex flex-col gap-3">
       <label className="text-xs font-bold text-slate-400  ml-1">Tenure Type</label>
       <select
        value={formData.status_hunian}
        onChange={(e) => setFormData({...formData, status_hunian: e.target.value})}
        className="w-full px-5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-950/5 focus:border-slate-950 transition-all outline-none appearance-none"
       >
        <option value="Pemilik">Primary Owner</option>
        <option value="Kontrak">Rental / Lease</option>
        <option value="Kosong">Vacant Unit</option>
       </select>
      </div>
      <Input 
       label="Land Area (m²)"
       type="number"
       required 
       value={formData.luas_tanah} 
       onChange={(e) => setFormData({...formData, luas_tanah: parseInt(e.target.value) || 0})}
       placeholder="e.g. 120"
       icon={Map}
      />
     </div>

     <div className="flex gap-4 pt-6">
      <Button variant="ghost" className="flex-1 py-3 font-bold  text-xs" onClick={() => setIsModalOpen(false)}>Cancel</Button>
      <Button variant="primary" className="flex-1 py-3  shadow-none font-bold  text-xs" onClick={handleAddWarga} isLoading={isSubmitting}>
       {isEditMode ? "Finalize Updates" : "Complete Registry"}
      </Button>
     </div>
    </div>
   </Modal>
  </div>
 );
}
