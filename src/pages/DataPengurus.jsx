import { useState, useEffect, useCallback } from "react";
import { Plus, Edit, Trash2, Search, Shield, Calendar, UserCheck, Phone, Briefcase, Award, Users, UserCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button, Input, Card, CardHeader, Badge, Table, THead, TBody, TR, TH, TD, Modal, Select } from "@/components/ui";
import { SelectionRequired } from "@/components/ui/SelectionRequired";

const StaffStatCard = ({ title, value, type = "neutral" }) => {
  const bgMap = {
    neutral: "bg-slate-50",
    success: "bg-emerald-50",
    blue: "bg-blue-50",
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 flex flex-col justify-between hover:shadow-sm transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium uppercase tracking-wider">
          {title}
        </div>
        <div className={`w-8 h-8 rounded-full ${bgMap[type]} flex items-center justify-center`}>
        </div>
      </div>
      <div>
        <h3 className="text-2xl font-bold text-slate-900 tracking-tight leading-none">{value}</h3>
      </div>
    </div>
  );
};

export default function DataPengurus() {
  const { profile, selectedPerumahanId } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setSearchTerming] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [wargaList, setWargaList] = useState([]);
  
  const [formData, setFormData] = useState({
    warga_id: "",
    jabatan: "Ketua RT",
    role_id: "",
    periode: "2025-2027",
    is_owner: false
  });
  
  const [roleList, setRoleList] = useState([]);
  
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      if (!selectedPerumahanId) return;

      const [staffRes, wargaRes, roleListRes] = await Promise.all([
        supabase
          .from('pengurus')
          .select('*, warga:warga_id(nama, no_hp, blok), role:role_id(name)')
          .eq('perumahan_id', selectedPerumahanId)
          .order('created_at', { ascending: true }),
        supabase
          .from('warga')
          .select('id, nama, blok, no_hp')
          .eq('perumahan_id', selectedPerumahanId)
          .eq('status_aktif', true)
          .order('nama'),
        supabase
          .from('perumahan_roles')
          .select('*')
          .eq('perumahan_id', selectedPerumahanId)
          .order('name')
      ]);

      if (staffRes.error) throw staffRes.error;
      if (wargaRes.error) throw wargaRes.error;
      
      setData(staffRes.data || []);
      setWargaList(wargaRes.data || []);
      setRoleList(roleListRes.data || []);
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
      role_id: item.role_id || "",
      periode: item.periode || "2025-2027",
      is_owner: item.is_owner || false
    });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleAddStaff = async (e) => {
    if (e) e.preventDefault();
    if (!selectedPerumahanId) return;
    setSearchTerming(true);
    try {
      const payload = { ...formData };
      if (!payload.role_id) payload.role_id = null;
      if (!payload.warga_id) throw new Error("Warga harus dipilih");

      if (isEditMode) {
        const { error } = await supabase
          .from('pengurus')
          .update(payload)
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('pengurus')
          .insert([{ ...payload, perumahan_id: selectedPerumahanId }]);
        if (error) throw error;
      }
      
      setIsModalOpen(false);
      setIsEditMode(false);
      setEditingId(null);
      setFormData({ warga_id: "", jabatan: "Ketua RT", role_id: "", periode: "2025-2027", is_owner: false });
      fetchData();
    } catch (err) {
      alert(`Submission failed: ${err.message}\nDetails: ${err.details || '-'}\nHint: ${err.hint || '-'}`);
    } finally {
      setSearchTerming(false);
    }
  };

  const handleTransferOwnership = async (target) => {
    if (!window.confirm(`Transfer Ownership perumahan ke ${target.warga?.nama}? \n\nPERINGATAN: Anda akan kehilangan akses Admin Utama.`)) return;
    try {
      const { error } = await supabase.rpc('transfer_perumahan_ownership', {
        p_perumahan_id: selectedPerumahanId,
        p_new_owner_id: target.id
      });
      if (error) throw error;
      alert("Transfer berhasil! Sesi akan diperbarui.");
      window.location.reload();
    } catch (err) {
      alert("Transfer gagal: " + err.message);
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
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Organisasi Pengurus</h1>
          <p className="text-slate-500 text-sm mt-1">Kelola struktur kepengurusan dan penugasan warga.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="primary" size="md" icon={Plus} onClick={() => {
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
                className="w-96"
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
                <TR key={i}><TD colSpan={5}><div className="h-16 bg-slate-50/50 rounded-2xl animate-pulse"></div></TD></TR>
              ))
            ) : filteredData.length === 0 ? (
              <TR><TD colSpan={5} textAlign="center" className="py-24 text-[10px] font-bold tracking-[0.3em] text-slate-400 uppercase">Belum ada pengurus yang terdaftar.</TD></TR>
            ) : filteredData.map((item) => (
              <TR key={item.id} className="group">
                <TD>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center text-white transition-transform group-hover:scale-110 duration-500 shadow-lg shadow-slate-100">
                      <span className="font-bold text-xs">{item.warga?.nama?.charAt(0) || "?"}</span>
                    </div>
                    <div className="flex flex-col">
                      <p className="text-sm font-semibold text-slate-900 tracking-tight">{item.warga?.nama}</p>
                      <p className="text-[10px] font-medium text-slate-400 mt-0.5">{item.warga?.blok}</p>
                    </div>
                  </div>
                </TD>
                <TD>
                  <div className="flex flex-col gap-1">
                    <Badge variant={item.is_owner ? "indigo" : "slate"} className={item.is_owner ? "bg-slate-900 text-white border-none" : ""}>
                      {item.role?.name || item.jabatan}
                    </Badge>
                    {item.is_owner && <span className="text-[9px] font-bold text-slate-400 uppercase text-center tracking-widest mt-1">Admin Utama</span>}
                  </div>
                </TD>
                <TD className="text-slate-500 text-xs font-medium">{item.warga?.no_hp || "-"}</TD>
                <TD className="text-sm font-semibold text-slate-900">{item.periode}</TD>
                <TD textAlign="right">
                  <div className="flex justify-end gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        const phone = item.warga?.no_hp?.replace(/\D/g, '');
                        if (phone) window.open(`https://wa.me/${phone.startsWith('0') ? '62' + phone.slice(1) : phone}`, '_blank');
                      }} 
                      className="text-emerald-500 hover:bg-emerald-50" 
                      title="Chat WhatsApp"
                    >
                      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.94 3.659 1.437 5.63 1.437h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                    </Button>
                    <Button variant="ghost" size="sm" icon={Edit} onClick={() => handleEdit(item)} className="text-slate-400 hover:text-slate-950 hover:bg-slate-50" />
                    {profile?.pengurus?.is_owner && !item.is_owner && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        icon={Award} 
                        onClick={() => handleTransferOwnership(item)} 
                        className="text-amber-500 hover:bg-amber-50" 
                        title="Transfer Ownership"
                      />
                    )}
                    <Button variant="ghost" size="sm" icon={Trash2} onClick={() => handleDelete(item.id)} className="text-slate-300 hover:text-red-500 hover:bg-red-50" />
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
        <div className="space-y-8 p-2">
          <div className="flex items-center gap-4 bg-slate-50 p-6 rounded-xl border border-slate-100">
            <div className="w-10 h-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-900 shrink-0 shadow-sm">
              <Award className="w-5 h-5" />
            </div>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">Pengurus harus dipilih dari daftar warga aktif yang sudah terdaftar di sistem.</p>
          </div>

          <Select 
            label="Pilih Warga"
            value={formData.warga_id}
            onChange={(e) => setFormData({...formData, warga_id: e.target.value})}
            required
          >
            <option value="">-- Pilih Warga --</option>
            {wargaList.map(w => (
              <option key={w.id} value={w.id}>{w.nama} ({w.blok})</option>
            ))}
          </Select>

          <div className="grid grid-cols-2 gap-10">
            <Select 
              label="Hak Akses (Role)"
              value={formData.role_id}
              onChange={(e) => setFormData({...formData, role_id: e.target.value})}
              required
            >
              <option value="">-- Pilih Peran --</option>
              {roleList.map(r => (
                <option key={r.id} value={r.id}>{r.name} {r.is_system ? '(Sistem)' : ''}</option>
              ))}
            </Select>
            <Input 
              label="Periode Jabatan"
              required 
              value={formData.periode} 
              onChange={(e) => setFormData({...formData, periode: e.target.value})}
              placeholder="e.g. 2025-2027"
              icon={Calendar}
            />
          </div>

          <div className="grid grid-cols-1">
            <Input 
              label="Keterangan Jabatan (Opsional)"
              value={formData.jabatan} 
              onChange={(e) => setFormData({...formData, jabatan: e.target.value})}
              placeholder="e.g. Bendahara Umum"
              icon={Briefcase}
            />
          </div>

          <div className="flex gap-4 pt-6">
            <Button variant="ghost" className="flex-1 py-2.5 font-semibold" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button variant="primary" className="flex-1 py-2.5 font-semibold" onClick={handleAddStaff} isLoading={isSubmitting}>
              {isEditMode ? "Simpan Perubahan" : "Konfirmasi Penugasan"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
