import { useState, useEffect, useCallback } from "react";
import { Plus, Edit, Trash2, Search, Briefcase, DollarSign, Filter, CreditCard, Banknote, History, Wallet, UserCircle, CalendarDays, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button, Input, Card, CardHeader, Badge, Table, THead, TBody, TR, TH, TD, Modal, Select } from "@/components/ui";
import { SelectionRequired } from "@/components/ui/SelectionRequired";

// eslint-disable-next-line no-unused-vars
const PayrollStatCard = ({ title, value, icon: Icon, type = "neutral" }) => {
  const styles = {
    neutral: "bg-slate-950 text-white",
    success: "bg-green-50 text-green-600",
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-violet-600 text-white",
  };

  return (
    <Card className="relative overflow-hidden group">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-start">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500 ${styles[type]}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
        
        <div className="space-y-1">
          <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{value}</h3>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{title}</p>
        </div>
      </div>
      <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-slate-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
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
    pengurus_id: "",
    bulan: new Date().getMonth() + 1,
    tahun: new Date().getFullYear(),
    jumlah: 0,
    status: "Pending"
  });
  const [staffList, setStaffList] = useState([]);
  const [stats, setStats] = useState({ totalActive: 0, totalPayroll: 0 });

  const fetchPayroll = useCallback(async () => {
    try {
      setLoading(true);
      if (!selectedPerumahanId) return;
      const { data: payroll } = await supabase
        .from('penggajian')
        .select(`
          *,
          pengurus:pengurus_id(
            id,
            jabatan,
            warga:warga_id(nama)
          )
        `)
        .eq('perumahan_id', selectedPerumahanId)
        .order('created_at', { ascending: false });
      
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

    const { data: staff } = await supabase
      .from('pengurus')
      .select('id, jabatan, warga:warga_id(nama)')
      .eq('perumahan_id', selectedPerumahanId);
    setStaffList(staff || []);
  }, [selectedPerumahanId]);

  const handleEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      pengurus_id: item.pengurus_id || "",
      bulan: item.bulan || new Date().getMonth() + 1,
      tahun: item.tahun || new Date().getFullYear(),
      jumlah: item.jumlah || 0,
      status: item.status || "Pending"
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
          .insert([{ ...formData, perumahan_id: selectedPerumahanId }]);
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

  const filteredData = data.filter(item => {
    const staffName = item.pengurus?.warga?.nama || "";
    const position = item.pengurus?.jabatan || "";
    return staffName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           position.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (profile?.role === 'super_admin' && !selectedPerumahanId) {
    return <SelectionRequired />;
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sistem Penggajian</h1>
          <p className="text-slate-500 text-sm mt-1">Kelola honorarium, penerbitan slip gaji, dan pengeluaran staf.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" icon={History} className="text-slate-500 font-semibold hover:bg-slate-50">Riwayat Ledger</Button>
          <Button variant="primary" size="md" icon={Plus} onClick={() => {
            setIsEditMode(false);
            setEditingId(null);
            setFormData({ nama_staf: "", jabatan: "Keamanan", bulan: new Date().getMonth() + 1, tahun: new Date().getFullYear(), jumlah: 0, status: "Lunas" });
            setIsModalOpen(true);
          }}>Buat Slip Gaji</Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        <PayrollStatCard title="Tenaga Kerja Aktif" value={stats.totalActive} icon={Briefcase} type="blue" />
        <PayrollStatCard title="Total Pengeluaran Gaji" value={`Rp ${(stats.totalPayroll / 1000000).toFixed(1)}M`} icon={Banknote} type="success" />
        <PayrollStatCard title="Status Pencairan" value="Tervalidasi" icon={CreditCard} type="purple" />
      </div>

      {/* Data Card */}
      <Card noPadding>
        <CardHeader 
          title="Registrasi Remunerasi" 
          subtitle="Log kronologis lengkap dari semua slip gaji yang diterbitkan"
          action={
            <div className="flex gap-4">
              <Input 
                placeholder="Cari nama staf..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={Search}
                className="w-96"
              />
              <Button variant="ghost" icon={Filter} size="sm" className="text-slate-400 uppercase tracking-widest text-[10px]" />
            </div>
          }
        />

        <div className="hidden md:block">
        <Table>
          <THead>
            <TR isHeader>
              <TH>Identitas Staf</TH>
              <TH>Jabatan</TH>
              <TH>Periode Gaji</TH>
              <TH textAlign="right">Gaji Bersih</TH>
              <TH textAlign="right">Aksi</TH>
            </TR>
          </THead>
          <TBody>
            {loading ? (
              Array(4).fill(0).map((_, i) => (
                <TR key={i}><TD colSpan={5}><div className="h-16 bg-slate-50/50 rounded-2xl animate-pulse"></div></TD></TR>
              ))
            ) : filteredData.length === 0 ? (
              <TR><TD colSpan={5} textAlign="center" className="py-24 text-[10px] font-bold tracking-[0.3em] text-slate-400 uppercase">Registry kosong. Tidak ada catatan gaji ditemukan.</TD></TR>
            ) : filteredData.map((item) => (
              <TR key={item.id} className="group">
                <TD>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white transition-transform group-hover:scale-110 duration-500">
                      <span className="font-bold text-xs">{(item.pengurus?.warga?.nama || "?").charAt(0)}</span>
                    </div>
                    <div className="flex flex-col">
                      <p className="text-sm font-semibold text-slate-900 tracking-tight">{item.pengurus?.warga?.nama}</p>
                      <p className="text-[10px] font-medium text-slate-400 mt-0.5">SLIP: {item.id.substring(0, 8).toUpperCase()}</p>
                    </div>
                  </div>
                </TD>
                <TD>
                  <Badge variant="indigo">
                    {item.pengurus?.jabatan}
                  </Badge>
                </TD>
                <TD className="text-xs font-medium text-slate-500">
                  {new Date(0, item.bulan - 1).toLocaleString('id-ID', { month: 'short' })} {item.tahun}
                </TD>
                <TD className="text-sm font-bold text-slate-900 text-right tracking-tight">
                  <span className="text-[10px] opacity-40 mr-1">Rp</span>
                  {item.jumlah?.toLocaleString()}
                </TD>
                <TD textAlign="right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" icon={Edit} onClick={() => handleEdit(item)} className="text-slate-300 hover:text-slate-950 hover:bg-slate-50" />
                    <Button variant="ghost" size="sm" icon={Trash2} onClick={() => handleDelete(item.id)} className="text-slate-300 hover:text-red-500 hover:bg-red-50" />
                  </div>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
        </div>

        {/* Mobile View */}
        <div className="block md:hidden space-y-4 px-4 py-2">
          {loading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-32 bg-slate-50 rounded-2xl animate-pulse"></div>
            ))
          ) : filteredData.length === 0 ? (
            <div className="text-center py-20 text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em]">
              Data gaji tidak ditemukan
            </div>
          ) : (
            filteredData.map((item) => (
              <Card key={item.id} className="p-4 flex flex-col gap-3 border border-slate-100 shadow-sm">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-900 tracking-tight">{item.pengurus?.warga?.nama}</span>
                    <span className="text-[10px] font-bold text-indigo-600 mt-0.5">{item.pengurus?.jabatan || "Staf"}</span>
                  </div>
                  <Badge variant="indigo">
                    {new Date(0, item.bulan - 1).toLocaleString('id-ID', { month: 'short' })} {item.tahun}
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center border-t border-slate-50 pt-3">
                  <span className="text-sm font-bold text-slate-900 tracking-tight">
                    <span className="text-[10px] opacity-40 mr-1">Rp</span>
                    {item.jumlah?.toLocaleString()}
                  </span>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(item)} className="text-slate-700">
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(item.id)} className="text-red-600 hover:bg-red-50 border-red-200">
                      Hapus
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </Card>

      {/* Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={isEditMode ? "Ubah Slip Gaji" : "Penerbitan Slip Gaji Baru"}
      >
        <form onSubmit={handleAddPayroll} className="space-y-8 p-2">
          <div className="flex items-center gap-4 bg-slate-50 p-6 rounded-xl border border-slate-100">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">Peringatan Kepatuhan</h4>
              <p className="text-xs text-slate-500 font-medium leading-relaxed tracking-tight">Pastikan jumlah gaji sesuai dengan kesepakatan masa kerja dan log kerja yang divalidasi.</p>
            </div>
          </div>
          <Select 
            label="Pilih Anggota Staf"
            required 
            value={formData.pengurus_id} 
            onChange={(e) => setFormData({...formData, pengurus_id: e.target.value})}
            icon={UserCircle}
          >
            <option value="">-- Pilih Staf --</option>
            {staffList.map(s => (
              <option key={s.id} value={s.id}>{s.warga?.nama} ({s.jabatan})</option>
            ))}
          </Select>

          <div className="grid grid-cols-1 gap-8">
            <Input 
              label="Jumlah Gaji (Rp)"
              type="number"
              required 
              value={formData.jumlah} 
              onChange={(e) => setFormData({...formData, jumlah: parseInt(e.target.value) || 0})}
              placeholder="0"
              icon={Wallet}
            />
          </div>

          <div className="grid grid-cols-2 gap-8">
            <Select 
              label="Payment Month"
              value={formData.bulan}
              onChange={(e) => setFormData({...formData, bulan: parseInt(e.target.value)})}
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('id-ID', { month: 'long' })}</option>
              ))}
            </Select>
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
            <Button variant="ghost" className="flex-1 py-2.5 font-semibold" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button variant="primary" className="flex-1 py-2.5 font-semibold" type="submit" isLoading={isSubmitting}>
              {isEditMode ? "Simpan Perubahan" : "Terbitkan Gaji"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
