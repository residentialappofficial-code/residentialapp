import { useState, useEffect, useCallback } from "react";
import { Search, Edit, Trash2, Plus, X, Building2, Map, ShieldCheck, UserCircle, Phone, Calendar, ArrowUpDown } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button, Input, Card, CardHeader, Badge, Table, THead, TBody, TR, TH, TD, Modal, Select } from "@/components/ui";

// eslint-disable-next-line no-unused-vars
const BlockStatCard = ({ title, value, icon: Icon, color = "slate" }) => {
  const colorMap = {
    slate: "text-slate-500",
    blue: "text-blue-500",
    green: "text-emerald-500",
    amber: "text-orange-500",
    indigo: "text-indigo-500",
  };
  
  const bgMap = {
    slate: "bg-slate-50",
    blue: "bg-blue-50",
    green: "bg-emerald-50",
    amber: "bg-orange-50",
    indigo: "bg-indigo-50",
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 flex flex-col justify-between hover:shadow-sm transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium uppercase tracking-wider">
          {title}
        </div>
        <div className={`w-8 h-8 rounded-full ${bgMap[color]} flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${colorMap[color]}`} />
        </div>
      </div>
      <div>
        <h3 className="text-2xl font-bold text-slate-900 tracking-tight leading-none">{value}</h3>
      </div>
    </div>
  );
};

export default function ManageBlocks() {
  const { selectedPerumahanId } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'blok_no', direction: 'asc' });
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    blok_no: "",
    luas_tanah: 0,
    tgl_serah_terima: "",
    status_hunian: "Kosong",
    nama_pemilik: "",
    kontak_pemilik: ""
  });

  const fetchData = useCallback(async (search = "") => {
    try {
      setLoading(true);
      if (!selectedPerumahanId) return;

      let query = supabase.from('blok')
        .select('*')
        .eq('perumahan_id', selectedPerumahanId)
        .order('blok_no', { ascending: true });
      
      if (search) {
        query = query.ilike('blok_no', `%${search}%`);
      }

      const { data: blocks, error } = await query;
      if (error) throw error;
      setData(blocks || []);
    } catch (error) {
      console.error("Error fetching blocks:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedPerumahanId]);

  useEffect(() => {
    if (selectedPerumahanId) {
      fetchData(searchTerm);
    }
  }, [selectedPerumahanId, searchTerm, fetchData]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    try {
      if (isEditMode) {
        const { error } = await supabase
          .from('blok')
          .update({
            blok_no: formData.blok_no,
            luas_tanah: formData.luas_tanah,
            tgl_serah_terima: formData.tgl_serah_terima || null,
            status_hunian: formData.status_hunian,
            nama_pemilik: formData.nama_pemilik,
            kontak_pemilik: formData.kontak_pemilik
          })
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('blok')
          .insert({
            ...formData,
            perumahan_id: selectedPerumahanId,
            tgl_serah_terima: formData.tgl_serah_terima || null
          });
        if (error) throw error;
      }
      
      setIsModalOpen(false);
      fetchData(searchTerm);
      setFormData({ blok_no: "", luas_tanah: 0, tgl_serah_terima: "", status_hunian: "Kosong", nama_pemilik: "", kontak_pemilik: "" });
    } catch (error) {
      alert("Gagal menyimpan: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      blok_no: item.blok_no || "",
      luas_tanah: item.luas_tanah || 0,
      tgl_serah_terima: item.tgl_serah_terima || "",
      status_hunian: item.status_hunian || "Kosong",
      nama_pemilik: item.nama_pemilik || "",
      kontak_pemilik: item.kontak_pemilik || ""
    });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Hapus blok ini? Pastikan tidak ada warga yang tertempel pada blok ini.")) return;
    try {
      const { error } = await supabase.from('blok').delete().eq('id', id);
      if (error) throw error;
      fetchData(searchTerm);
    } catch (err) {
      alert("Gagal menghapus: " + err.message);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Manajemen Blok</h1>
          <p className="text-slate-500 text-sm mt-1">Kelola unit rumah, luas tanah, dan tanggal serah terima.</p>
        </div>
        <Button 
          onClick={() => { setIsEditMode(false); setIsModalOpen(true); }}
          variant="primary" 
          icon={Plus}
        >
          Tambah Blok
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <BlockStatCard title="Total Unit" value={data.length} icon={Building2} color="slate" />
        <BlockStatCard title="Terhuni" value={data.filter(b => b.status_hunian !== 'Kosong').length} icon={ShieldCheck} color="blue" />
        <BlockStatCard title="Kosong" value={data.filter(b => b.status_hunian === 'Kosong').length} icon={X} color="amber" />
        <BlockStatCard title="Total Luas" value={`${data.reduce((acc, curr) => acc + (curr.luas_tanah || 0), 0)} m²`} icon={Map} color="green" />
      </div>

      <Card noPadding>
        <CardHeader 
          title="Daftar Blok" 
          subtitle="Data induk seluruh unit di komplek ini"
          action={
            <Input 
              placeholder="Cari nomor blok..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={Search}
              className="w-80"
            />
          }
        />

        <Table>
          <THead>
            <TR isHeader>
              <TH 
                onClick={() => setSortConfig({ key: 'blok_no', direction: sortConfig.key === 'blok_no' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}
                className="cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  Nomor Blok
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </TH>
              <TH 
                onClick={() => setSortConfig({ key: 'luas_tanah', direction: sortConfig.key === 'luas_tanah' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}
                className="cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  Luas Tanah
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </TH>
              <TH 
                onClick={() => setSortConfig({ key: 'tgl_serah_terima', direction: sortConfig.key === 'tgl_serah_terima' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}
                className="cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  Mulai Iuran
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </TH>
              <TH>Status</TH>
              <TH>Pemilik Aset</TH>
              <TH textAlign="right">Aksi</TH>
            </TR>
          </THead>
          <TBody>
            {loading ? (
              Array(5).fill(0).map((_, i) => (
                <TR key={i}><TD colSpan={6}><div className="h-16 bg-slate-50 animate-pulse rounded-xl"></div></TD></TR>
              ))
            ) : data.length === 0 ? (
              <TR><TD colSpan={6} textAlign="center" className="py-20 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Data blok tidak ditemukan</TD></TR>
            ) : [...data].sort((a, b) => {
                if (sortConfig.key === 'blok_no') {
                  return sortConfig.direction === 'asc' 
                    ? a.blok_no.localeCompare(b.blok_no) 
                    : b.blok_no.localeCompare(a.blok_no);
                }
                if (sortConfig.key === 'luas_tanah') {
                  return sortConfig.direction === 'asc' 
                    ? (a.luas_tanah || 0) - (b.luas_tanah || 0)
                    : (b.luas_tanah || 0) - (a.luas_tanah || 0);
                }
                if (sortConfig.key === 'tgl_serah_terima') {
                  const dateA = a.tgl_serah_terima || "0000-00-00";
                  const dateB = b.tgl_serah_terima || "0000-00-00";
                  return sortConfig.direction === 'asc' 
                    ? dateA.localeCompare(dateB) 
                    : dateB.localeCompare(dateA);
                }
                return 0;
              }).map((item) => (
              <TR key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                <TD className="font-bold text-slate-900 tracking-tight">{item.blok_no}</TD>
                <TD className="font-medium text-slate-600">{item.luas_tanah} m²</TD>
                <TD className="text-slate-500 font-medium">{item.tgl_serah_terima || "-"}</TD>
                <TD>
                  <Badge variant={
                    item.status_hunian === 'Dihuni' ? 'blue' :
                    item.status_hunian === 'Dikontrakkan' ? 'indigo' :
                    item.status_hunian === 'Kosong Dikunjungi' ? 'amber' : 'slate'
                  }>
                    {item.status_hunian}
                  </Badge>
                </TD>
                <TD>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-700 leading-none">{item.nama_pemilik || "-"}</span>
                    <span className="text-[10px] text-slate-400 font-bold mt-1">{item.kontak_pemilik || ""}</span>
                  </div>
                </TD>
                <TD textAlign="right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" icon={Edit} onClick={() => handleEdit(item)} />
                    <Button variant="ghost" size="sm" icon={Trash2} className="text-red-500 hover:bg-red-50" onClick={() => handleDelete(item.id)} />
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
        title={isEditMode ? "Edit Blok" : "Tambah Blok Baru"}
        footer={
          <div className="flex justify-end gap-3 w-full px-1">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button variant="primary" onClick={handleSubmit} isLoading={isSubmitting}>
              {isEditMode ? "Simpan Perubahan" : "Tambah Blok"}
            </Button>
          </div>
        }
      >
        <form className="space-y-6 pt-2">
          <div className="grid grid-cols-2 gap-8">
            <Input 
              label="Nomor Blok" 
              required
              value={formData.blok_no}
              onChange={(e) => setFormData({...formData, blok_no: e.target.value})}
              placeholder="Contoh: A1-05"
              icon={Building2}
            />
            <Input 
              label="Luas Tanah (m²)" 
              type="number"
              value={formData.luas_tanah}
              onChange={(e) => setFormData({...formData, luas_tanah: parseInt(e.target.value) || 0})}
              icon={Map}
            />
          </div>
          <div className="grid grid-cols-2 gap-8">
            <Input 
              label="Tanggal Serah Terima" 
              type="date"
              value={formData.tgl_serah_terima}
              onChange={(e) => setFormData({...formData, tgl_serah_terima: e.target.value})}
              icon={Calendar}
              helperText="Tanggal dimulainya perhitungan iuran"
            />
            <Select 
              label="Status Hunian"
              required
              value={formData.status_hunian}
              onChange={(e) => setFormData({...formData, status_hunian: e.target.value})}
            >
              <option value="Kosong">Kosong</option>
              <option value="Dihuni">Dihuni</option>
              <option value="Dikontrakkan">Dikontrakkan</option>
              <option value="Kosong Dikunjungi">Kosong Dikunjungi</option>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-100">
            <Input 
              label="Nama Pemilik Aset" 
              value={formData.nama_pemilik}
              onChange={(e) => setFormData({...formData, nama_pemilik: e.target.value})}
              placeholder="Sesuai Sertifikat"
              icon={UserCircle}
            />
            <Input 
              label="Kontak Pemilik" 
              value={formData.kontak_pemilik}
              onChange={(e) => setFormData({...formData, kontak_pemilik: e.target.value})}
              placeholder="0812..."
              icon={Phone}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
