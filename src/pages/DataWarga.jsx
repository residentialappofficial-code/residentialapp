import { useState, useEffect, useCallback } from "react";
import { Search, Edit, Trash2, Download, UserPlus, X, UserMinus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button, Input, Card, CardHeader, Badge, Table, THead, TBody, TR, TH, TD, Modal } from "@/components/ui";
import { SelectionRequired } from "@/components/ui/SelectionRequired";

export default function DataWarga() {
  const { selectedPerumahanId, profile } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    nama: "",
    blok: "",
    no_hp: "",
    email: "",
    status_hunian: "Pemilik"
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

  const handleAddWarga = async (e) => {
    e.preventDefault();
    if (!selectedPerumahanId) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('warga')
        .insert({
          ...formData,
          perumahan_id: selectedPerumahanId,
          status_iuran: 'Belum Lunas'
        });

      if (error) throw error;
      
      setIsModalOpen(false);
      setFormData({ nama: "", blok: "", no_hp: "", email: "", status_hunian: "Pemilik" });
      fetchData(searchTerm);
      alert("Warga berhasil ditambahkan!");
    } catch (error) {
      alert("Gagal menambah warga: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMutation = async (wargaId) => {
    if (!window.confirm("Proses mutasi/keluar warga ini? Akun akan dinonaktifkan.")) return;
    
    try {
      // 1. Cek tunggakan
      const { data: bills, error: billError } = await supabase
        .from('tagihan')
        .select('id')
        .eq('warga_id', wargaId)
        .eq('status', 'Unpaid');
      
      if (billError) throw billError;
      
      if (bills && bills.length > 0) {
        alert(`Gagal mutasi: Warga masih memiliki ${bills.length} tagihan yang belum dibayar.`);
        return;
      }

      // 2. Nonaktifkan
      const { error: updateError } = await supabase
        .from('warga')
        .update({ status_aktif: false })
        .eq('id', wargaId);
      
      if (updateError) throw updateError;

      alert("Warga berhasil dimutasi dan dinonaktifkan.");
      fetchData(searchTerm);
    } catch (err) {
      alert("Error mutasi: " + err.message);
    }
  };

  if (profile?.role === 'super_admin' && !selectedPerumahanId) {
    return <SelectionRequired />;
  }

  return (
    <div className="bg-transparent">
      <div className="flex flex-col gap-4">
        {/* Page Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Residents Data</h1>
            <p className="text-slate-500 text-sm font-medium">Manage information and housing status.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" icon={Download}>Export</Button>
            <Button variant="primary" icon={UserPlus} onClick={() => setIsModalOpen(true)}>Add Resident</Button>
          </div>
        </div>

        {/* Data Card */}
        <Card noPadding>
          <CardHeader 
            title="Resident List" 
            action={
              <Input 
                placeholder="Search by name or block..." 
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
                <TH>Resident Identity</TH>
                <TH>Block</TH>
                <TH>Area (m²)</TH>
                <TH>Phone</TH>
                <TH>Status</TH>
                <TH>Dues</TH>
                <TH textAlign="right">Actions</TH>
              </TR>
            </THead>
            <TBody>
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <TR key={i}><TD colSpan={7}><div className="h-5 bg-slate-100 rounded animate-pulse"></div></TD></TR>
                ))
              ) : data.length === 0 ? (
                <TR><TD colSpan={7} textAlign="center" className="py-20 text-slate-400">No residents found.</TD></TR>
              ) : data.map((item) => (
                <TR key={item.id}>
                  <TD>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 font-bold text-xs uppercase">
                        {item.nama?.charAt(0) || "?"}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{item.nama}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">ID: WRG-{item.id.slice(0, 4)}</p>
                      </div>
                    </div>
                  </TD>
                  <TD className="text-slate-900 font-bold">{item.blok}</TD>
                  <TD className="text-slate-900 font-bold">{item.luas_tanah || 0} m²</TD>
                  <TD className="text-slate-500">{item.no_hp || "-"}</TD>
                  <TD>
                    <Badge variant={item.status_hunian === 'Pemilik' ? 'blue' : 'indigo'}>
                      {item.status_hunian}
                    </Badge>
                  </TD>
                  <TD>
                    <Badge variant={item.status_iuran === 'Lunas' ? 'green' : 'red'}>
                      {item.status_iuran === 'Lunas' ? 'PAID' : 'DUE'}
                    </Badge>
                  </TD>
                  <TD textAlign="right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="xs" icon={Edit} title="Edit" />
                      <Button variant="ghost" size="xs" icon={UserMinus} className="text-amber-600" title="Mutasi Warga" onClick={() => handleMutation(item.id)} />
                      <Button variant="danger" size="xs" icon={Trash2} title="Hapus Permanen" />
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>

          {/* Pagination Mock */}
          <div className="px-6 py-4 bg-slate-50 flex justify-between items-center border-t border-slate-100">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Showing {data.length} results</p>
            <div className="flex gap-2">
              <Button variant="outline" size="xs" disabled>Prev</Button>
              <Button variant="dark" size="xs">1</Button>
              <Button variant="outline" size="xs" disabled>Next</Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Add Resident Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Resident">
        <form onSubmit={handleAddWarga} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
              <Input 
                required 
                value={formData.nama} 
                onChange={(e) => setFormData({...formData, nama: e.target.value})}
                placeholder="e.g. John Doe"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Block / Unit</label>
              <Input 
                required 
                value={formData.blok} 
                onChange={(e) => setFormData({...formData, blok: e.target.value})}
                placeholder="e.g. A-12"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email (for Activation)</label>
              <Input 
                type="email"
                value={formData.email} 
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="warga@example.com"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Phone Number</label>
              <Input 
                value={formData.no_hp} 
                onChange={(e) => setFormData({...formData, no_hp: e.target.value})}
                placeholder="0812..."
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Housing Status</label>
              <select
                value={formData.status_hunian}
                onChange={(e) => setFormData({...formData, status_hunian: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all font-medium"
              >
                <option value="Pemilik">Pemilik</option>
                <option value="Kontrak">Kontrak</option>
                <option value="Kosong">Kosong</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5 col-span-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Land Area (m²)</label>
              <Input 
                type="number"
                required 
                value={formData.luas_tanah} 
                onChange={(e) => setFormData({...formData, luas_tanah: parseInt(e.target.value) || 0})}
                placeholder="e.g. 120"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Resident"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
