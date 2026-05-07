import { useState, useEffect, useCallback } from "react";
import { Plus, Edit, Trash2, Search, Briefcase, DollarSign, Filter, CreditCard, Banknote, History, Wallet, UserCircle, CalendarDays, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button, Input, Card, CardHeader, Badge, Table, THead, TBody, TR, TH, TD, Modal } from "@/components/ui";
import { SelectionRequired } from "@/components/ui/SelectionRequired";

const PayrollStatCard = ({ title, value, icon: Icon, type = "neutral" }) => {
  const styles = {
    neutral: "bg-slate-950 text-white border border-slate-900 shadow-none",
    success: "bg-green-50 text-green-600 border border-green-100 shadow-none",
    blue: "bg-blue-50 text-blue-600 border border-blue-100 shadow-none",
    purple: "bg-violet-600 text-white shadow-none",
  };

  return (
    <Card className="relative overflow-hidden group">
      <div className="flex flex-col gap-8">
        <div className="flex justify-between items-start">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-[0_1px_2px_rgba(0,0,0,0.03)] ${styles[type]}  transition-transform group-hover:scale-110 duration-300`}>
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

export default function Penggajian() {
 const { selectedPerumahanId, profile } = useAuth();
 const [data, setData] = useState([]);
 const [loading, setLoading] = useState(true);
 const [searchTerm, setSearchTerm] = useState("");
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [isEditMode, setIsEditMode] = useState(false);
 const [editingId, setEditingId] = useState(null);
 const [formData, setFormData] = useState({
  nama_staf: "",
  jabatan: "Keamanan",
  bulan: new Date().getMonth() + 1,
  tahun: new Date().getFullYear(),
  jumlah: 0,
  status: "Lunas"
 });
 const [stats, setStats] = useState({ totalActive: 0, totalPayroll: 0 });

 const fetchPayroll = useCallback(async () => {
  try {
   setLoading(true);
   if (!selectedPerumahanId) return;
   const { data: payroll } = await supabase
    .from('penggajian')
    .select('*')
    .eq('perumahan_id', selectedPerumahanId)
    .order('tanggal', { ascending: false });
   
   setData(payroll || []);
  } catch {
   console.error("Gagal memuat data gaji");
  } finally {
   setLoading(false);
  }
 }, [selectedPerumahanId]);

 const fetchStats = useCallback(async () => {
  if (!selectedPerumahanId) return;
  const { count: staffCount } = await supabase.from('pengurus').select('*', { count: 'exact', head: true }).eq('perumahan_id', selectedPerumahanId);
  const { data: payrolls } = await supabase.from('penggajian').select('jumlah').eq('perumahan_id', selectedPerumahanId);
  const total = payrolls?.reduce((acc, curr) => acc + curr.jumlah, 0) || 0;
  setStats({ totalActive: staffCount || 0, totalPayroll: total });
 }, [selectedPerumahanId]);

 const handleEdit = (item) => {
  setEditingId(item.id);
  setFormData({
   nama_staf: item.nama_staf || "",
   jabatan: item.jabatan || "Keamanan",
   bulan: item.bulan || new Date().getMonth() + 1,
   tahun: item.tahun || new Date().getFullYear(),
   jumlah: item.jumlah || 0,
   status: item.status || "Lunas"
  });
  setIsEditMode(true);
  setIsModalOpen(true);
 };

 useEffect(() => {
  fetchPayroll();
  fetchStats();
 }, [fetchPayroll, fetchStats]);

 const handleAddPayroll = async (e) => {
  if (e) e.preventDefault();
  if (!selectedPerumahanId) return;
  setIsSubmitting(true);
  try {
   if (isEditMode) {
    const { error } = await supabase
     .from('penggajian')
     .update(formData)
     .eq('id', editingId);
    if (error) throw error;
   } else {
    const { error } = await supabase
     .from('penggajian')
     .insert([{ ...formData, perumahan_id: selectedPerumahanId, tanggal: new Date() }]);
    if (error) throw error;
   }
   
   setIsModalOpen(false);
   setIsEditMode(false);
   setEditingId(null);
   setFormData({ 
    nama_staf: "", 
    jabatan: "Keamanan", 
    bulan: new Date().getMonth() + 1, 
    tahun: new Date().getFullYear(), 
    jumlah: 0, 
    status: "Lunas" 
   });
   fetchPayroll();
   fetchStats();
  } catch (err) {
   alert("Submission failed: " + err.message);
  } finally {
   setIsSubmitting(false);
  }
 };

 const handleDelete = async (id) => {
  if (!window.confirm("Delete this payroll record permanently?")) return;
  try {
   const { error } = await supabase.from('penggajian').delete().eq('id', id);
   if (error) throw error;
   fetchPayroll();
   fetchStats();
  } catch (err) {
   alert("Delete failed: " + err.message);
  }
 };

 const filteredData = data.filter(item => 
  item.nama_staf?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  item.jabatan?.toLowerCase().includes(searchTerm.toLowerCase())
 );

 if (profile?.role === 'super_admin' && !selectedPerumahanId) {
  return <SelectionRequired />;
 }

 return (
  <div className="flex flex-col gap-6">
   {/* Header */}
   <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
    <div>
     <h1 className="text-xl font-bold text-slate-900 tracking-tight">Payroll Engine</h1>
     <p className="text-slate-500 text-sm font-medium">Manage remunerations, slip issuance, and staff expenditures.</p>
    </div>
    <div className="flex items-center gap-4">
     <Button variant="ghost" icon={History} className="text-slate-400 font-bold hover:bg-slate-50">Ledger History</Button>
     <Button variant="primary" size="lg" icon={Plus} className="px-10  shadow-none" onClick={() => {
      setIsEditMode(false);
      setEditingId(null);
      setFormData({ nama_staf: "", jabatan: "Keamanan", bulan: new Date().getMonth() + 1, tahun: new Date().getFullYear(), jumlah: 0, status: "Lunas" });
      setIsModalOpen(true);
     }}>Issue Slip</Button>
    </div>
   </div>

   {/* Stats Grid */}
   <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
    <PayrollStatCard title="Active Workforce" value={stats.totalActive} icon={Briefcase} type="blue" />
    <PayrollStatCard title="Aggregate Payout" value={`Rp ${(stats.totalPayroll / 1000000).toFixed(1)}M`} icon={Banknote} type="success" />
    <PayrollStatCard title="Disbursement" value="Validated" icon={CreditCard} type="purple" />
   </div>

   {/* Data Card */}
   <Card noPadding>
    <CardHeader 
     title="Remuneration Registry" 
     subtitle="Comprehensive chronological log of all issued payroll slips"
     action={
      <div className="flex gap-4">
       <Input 
        placeholder="Search by staff name..." 
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        icon={Search}
        className="w-80"
       />
       <Button variant="ghost" icon={Filter} size="sm" className="text-slate-400" />
      </div>
     }
    />

    <Table>
     <THead>
      <TR isHeader>
       <TH>Staff Identity</TH>
       <TH>Position</TH>
       <TH>Disbursement Cycle</TH>
       <TH textAlign="right">Net Payout</TH>
       <TH textAlign="right">Actions</TH>
      </TR>
     </THead>
     <TBody>
      {loading ? (
       Array(4).fill(0).map((_, i) => (
        <TR key={i}><TD colSpan={5}><div className="h-12 bg-slate-50 rounded-xl animate-pulse"></div></TD></TR>
       ))
      ) : filteredData.length === 0 ? (
       <TR><TD colSpan={5} textAlign="center" className="py-24 text-xs font-bold tracking-[0.3em] text-slate-400">Registry is empty. No payroll records found.</TD></TR>
      ) : filteredData.map((item) => (
       <TR key={item.id} className="group">
        <TD>
         <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center shadow-[0_1px_2px_rgba(0,0,0,0.03)] text-white  shadow-none transition-transform group-hover:scale-110 duration-500">
           <span className="font-bold text-sm ">{item.nama_staf?.charAt(0) || "?"}</span>
          </div>
          <div className="flex flex-col">
           <p className="text-sm font-bold text-slate-900 tracking-tight">{item.nama_staf}</p>
           <p className="text-[9px] text-slate-400 font-bold ">SLIP: {item.id.substring(0, 8).toUpperCase()}</p>
          </div>
         </div>
        </TD>
        <TD>
         <Badge variant="indigo" className="font-bold">
          {item.jabatan?.toUpperCase()}
         </Badge>
        </TD>
        <TD className="text-xs font-bold text-slate-400 ">
         {new Date(0, item.bulan - 1).toLocaleString('id-ID', { month: 'short' })} {item.tahun}
        </TD>
        <TD className="text-sm font-bold text-slate-900 text-right tracking-tight">
         <span className="text-xs opacity-40 mr-1">Rp</span>
         {item.jumlah?.toLocaleString()}
        </TD>
        <TD textAlign="right">
         <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" icon={Edit} onClick={() => handleEdit(item)} className="text-slate-400 hover:text-slate-950" />
          <Button variant="ghost" size="sm" icon={Trash2} onClick={() => handleDelete(item.id)} className="text-slate-300 hover:text-red-500" />
         </div>
        </TD>
       </TR>
      ))}
     </TBody>
    </Table>
   </Card>

   {/* Modal */}
   <Modal 
    isOpen={isModalOpen} 
    onClose={() => setIsModalOpen(false)} 
    title={isEditMode ? "Modify Disbursement Slip" : "Issue New Payroll Slip"}
   >
    <div className="space-y-10 p-2">
     <div className="flex items-center gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
      <div className="w-10 h-10 bg-slate-950 rounded-2xl flex items-center justify-center shadow-[0_1px_2px_rgba(0,0,0,0.03)] text-white ">
       <CheckCircle2 className="w-5 h-5" />
      </div>
      <p className="text-xs text-slate-500 font-bold leading-relaxed">Ensure disbursement amounts match tenure agreements and validated work logs.</p>
     </div>

     <Input 
      label="Staff Full Name"
      required 
      value={formData.nama_staf} 
      onChange={(e) => setFormData({...formData, nama_staf: e.target.value})}
      placeholder="e.g. Budi Santoso"
      icon={UserCircle}
     />

     <div className="grid grid-cols-2 gap-8">
      <Input 
       label="Assigned Position"
       required 
       value={formData.jabatan} 
       onChange={(e) => setFormData({...formData, jabatan: e.target.value})}
       placeholder="e.g. Night Security"
       icon={Briefcase}
      />
      <Input 
       label="Disbursement Amount (Rp)"
       type="number"
       required 
       value={formData.jumlah} 
       onChange={(e) => setFormData({...formData, jumlah: parseInt(e.target.value) || 0})}
       placeholder="0"
       icon={Wallet}
      />
     </div>

     <div className="grid grid-cols-2 gap-8">
      <div className="flex flex-col gap-3">
       <label className="text-xs font-bold text-slate-400  ml-1">Payment Month</label>
       <select 
        value={formData.bulan}
        onChange={(e) => setFormData({...formData, bulan: parseInt(e.target.value)})}
        className="w-full px-5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-950/5 focus:border-slate-950 transition-all outline-none appearance-none"
       >
        {Array.from({ length: 12 }, (_, i) => (
         <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('id-ID', { month: 'long' })}</option>
        ))}
       </select>
      </div>
      <Input 
       label="Fiscal Year"
       type="number"
       required 
       value={formData.tahun} 
       onChange={(e) => setFormData({...formData, tahun: parseInt(e.target.value)})}
       icon={CalendarDays}
      />
     </div>

     <div className="flex gap-4 pt-6">
      <Button variant="ghost" className="flex-1 py-3 font-bold  text-xs" onClick={() => setIsModalOpen(false)}>Cancel</Button>
      <Button variant="primary" className="flex-1 py-3  shadow-none font-bold  text-xs" onClick={handleAddPayroll} isLoading={isSubmitting}>
       {isEditMode ? "Finalize Updates" : "Issue Disbursement"}
      </Button>
     </div>
    </div>
   </Modal>
  </div>
 );
}
