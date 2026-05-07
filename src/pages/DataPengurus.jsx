import { useState, useEffect, useCallback } from "react";
import { Plus, Edit, Trash2, Search, Shield, Calendar, UserCheck, Phone, Briefcase, Award, Users, UserCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button, Input, Card, CardHeader, Badge, Table, THead, TBody, TR, TH, TD, Modal } from "@/components/ui";
import { SelectionRequired } from "@/components/ui/SelectionRequired";

const StaffStatCard = ({ title, value, icon: Icon, type = "neutral" }) => {
  const styles = {
    neutral: "bg-slate-950 text-white border border-slate-900 shadow-none",
    success: "bg-green-50 text-green-600 border border-green-100 shadow-none",
    blue: "bg-blue-50 text-blue-600 border border-blue-100 shadow-none",
  };

  return (
    <Card className="relative overflow-hidden group border-none ">
      <div className="flex flex-col gap-8 relative z-10">
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${styles[type]}  transition-transform group-hover:scale-110 duration-500`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-slate-900 tracking-tighter leading-none">{value}</h3>
          <p className="text-xs font-bold text-slate-400 tracking-[0.25em]">{title}</p>
        </div>
      </div>
      <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-slate-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
    </Card>
  );
};

export default function DataPengurus() {
  const { profile, selectedPerumahanId } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [wargaList, setWargaList] = useState([]);
  
  const [formData, setFormData] = useState({
    warga_id: "",
    jabatan: "Ketua RT",
    periode: "2025-2027"
  });
  
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      if (!selectedPerumahanId) return;

      const [staffRes, wargaRes] = await Promise.all([
        supabase
          .from('pengurus')
          .select('*, warga:warga_id(nama, no_hp, blok)')
          .eq('perumahan_id', selectedPerumahanId)
          .order('created_at', { ascending: true }),
        supabase
          .from('warga')
          .select('id, nama, blok, no_hp')
          .eq('perumahan_id', selectedPerumahanId)
          .eq('status_aktif', true)
          .order('nama')
      ]);

      if (staffRes.error) throw staffRes.error;
      if (wargaRes.error) throw wargaRes.error;
      
      setData(staffRes.data || []);
      setWargaList(wargaRes.data || []);
    } catch (err) {
      console.error("Error fetching staff data:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedPerumahanId]);

  const handleEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      warga_id: item.warga_id || "",
      jabatan: item.jabatan || "Ketua RT",
      periode: item.periode || "2025-2027"
    });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleAddStaff = async (e) => {
    if (e) e.preventDefault();
    if (!selectedPerumahanId) return;
    setIsSubmitting(true);
    try {
      if (isEditMode) {
        const { error } = await supabase
          .from('pengurus')
          .update(formData)
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('pengurus')
          .insert([{ ...formData, perumahan_id: selectedPerumahanId }]);
        if (error) throw error;
      }
      
      setIsModalOpen(false);
      setIsEditMode(false);
      setEditingId(null);
      setFormData({ warga_id: "", jabatan: "Ketua RT", periode: "2025-2027" });
      fetchData();
    } catch (err) {
      alert("Submission failed: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this staff record permanently?")) return;
    try {
      const { error } = await supabase.from('pengurus').delete().eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredData = data.filter(item => {
    const nameMatch = item.warga?.nama?.toLowerCase().includes(searchTerm.toLowerCase());
    const jabatanMatch = item.jabatan?.toLowerCase().includes(searchTerm.toLowerCase());
    return nameMatch || jabatanMatch;
  });

  if (profile?.role === 'super_admin' && !selectedPerumahanId) {
    return <SelectionRequired />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Organisasi Pengurus</h1>
          <p className="text-slate-500 text-sm font-medium">Kelola struktur kepengurusan dan penugasan warga.</p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="primary" size="lg" icon={Plus} className="px-10  shadow-none" onClick={() => {
            setIsEditMode(false);
            setEditingId(null);
            setFormData({ warga_id: "", jabatan: "Ketua RT", periode: "2025-2027" });
            setIsModalOpen(true);
          }}>Tambah Pengurus</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <StaffStatCard title="Pengurus Aktif" value={data.length} icon={Shield} type="neutral" />
        <StaffStatCard title="Periode Berjalan" value="2025-2027" icon={Calendar} type="blue" />
        <StaffStatCard title="Status Verifikasi" value="Verified" icon={UserCheck} type="success" />
      </div>

      <Card noPadding>
        <CardHeader 
          title="Struktur Organisasi" 
          subtitle="Database pengurus aktif yang bertugas di lingkungan perumahan"
          action={
            <div className="flex gap-4">
              <Input 
                placeholder="Cari nama atau jabatan..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={Search}
                className="w-80"
              />
              <Button variant="ghost" icon={Briefcase} size="sm" className="text-slate-400" />
            </div>
          }
        />

        <Table>
          <THead>
            <TR isHeader>
              <TH>Identitas Pengurus</TH>
              <TH>Jabatan</TH>
              <TH>Kontak</TH>
              <TH>Periode</TH>
              <TH textAlign="right">Aksi</TH>
            </TR>
          </THead>
          <TBody>
            {loading ? (
              Array(4).fill(0).map((_, i) => (
                <TR key={i}><TD colSpan={5}><div className="h-12 bg-slate-50 rounded-xl animate-pulse"></div></TD></TR>
              ))
            ) : filteredData.length === 0 ? (
              <TR><TD colSpan={5} textAlign="center" className="py-24 text-xs font-bold tracking-[0.3em] text-slate-400">Belum ada pengurus yang terdaftar.</TD></TR>
            ) : filteredData.map((item) => (
              <TR key={item.id} className="group">
                <TD>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center shadow-[0_1px_2px_rgba(0,0,0,0.03)] text-white  shadow-none transition-transform group-hover:scale-110 duration-500">
                      <span className="font-bold text-sm ">{item.warga?.nama?.charAt(0) || "?"}</span>
                    </div>
                    <div className="flex flex-col">
                      <p className="text-sm font-bold text-slate-900 tracking-tight">{item.warga?.nama}</p>
                      <p className="text-[9px] text-slate-400 font-bold ">{item.warga?.blok}</p>
                    </div>
                  </div>
                </TD>
                <TD>
                  <Badge variant="indigo" className="font-bold">
                    {item.jabatan?.toUpperCase()}
                  </Badge>
                </TD>
                <TD className="text-slate-500 ">{item.warga?.no_hp || "-"}</TD>
                <TD className="text-slate-900 font-bold text-sm tracking-tight">{item.periode}</TD>
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

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={isEditMode ? "Ubah Data Pengurus" : "Penugasan Pengurus Baru"}
      >
        <div className="space-y-10 p-2">
          <div className="flex items-center gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
            <div className="w-10 h-10 bg-slate-950 rounded-2xl flex items-center justify-center shadow-[0_1px_2px_rgba(0,0,0,0.03)] text-white ">
              <Award className="w-5 h-5" />
            </div>
            <p className="text-xs text-slate-500 font-bold leading-relaxed">Pengurus harus dipilih dari daftar warga aktif yang sudah terdaftar di sistem.</p>
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-xs font-bold text-slate-400  ml-1">Pilih Warga</label>
            <select 
              value={formData.warga_id}
              onChange={(e) => setFormData({...formData, warga_id: e.target.value})}
              required
              className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-950/5 focus:border-slate-950 transition-all outline-none appearance-none"
            >
              <option value="">-- Pilih Warga --</option>
              {wargaList.map(w => (
                <option key={w.id} value={w.id}>{w.nama} ({w.blok})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="flex flex-col gap-3">
              <label className="text-xs font-bold text-slate-400  ml-1">Jabatan Pengurus</label>
              <select 
                value={formData.jabatan}
                onChange={(e) => setFormData({...formData, jabatan: e.target.value})}
                className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-950/5 focus:border-slate-950 transition-all outline-none appearance-none"
              >
                <option>Ketua RT</option>
                <option>Sekretaris</option>
                <option>Bendahara</option>
                <option>Keamanan</option>
                <option>Kebersihan</option>
                <option>Lainnya</option>
              </select>
            </div>
            <Input 
              label="Periode Jabatan"
              required 
              value={formData.periode} 
              onChange={(e) => setFormData({...formData, periode: e.target.value})}
              placeholder="e.g. 2025-2027"
              icon={Calendar}
            />
          </div>

          <div className="flex gap-4 pt-6">
            <Button variant="ghost" className="flex-1 py-3 font-bold  text-xs" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button variant="primary" className="flex-1 py-3  shadow-none font-bold  text-xs" onClick={handleAddStaff} isLoading={isSubmitting}>
              {isEditMode ? "Simpan Perubahan" : "Konfirmasi Penugasan"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
