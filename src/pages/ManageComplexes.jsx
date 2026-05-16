import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Building2, ShieldCheck, Users, Search, MoreHorizontal, Filter, MapPin, Layers, CheckCircle, Ban, ArrowUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button, Input, Card, CardHeader, Badge, Table, THead, TBody, TR, TH, TD, Modal } from "@/components/ui";

// eslint-disable-next-line no-unused-vars
const ComplexStatCard = ({ title, value, icon: Icon, color = "slate" }) => {
  const colors = {
    slate: "bg-slate-950 text-white",
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    red: "bg-red-50 text-red-600",
  };

  return (
    <Card className="relative overflow-hidden group">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-start">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500 ${colors[color]}`}>
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

export default function ManageComplexes() {
  const { switchPerumahan, selectedPerumahanId } = useAuth();
  const [complexes, setComplexes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nama: "",
    alamat: ""
  });

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

  const handleAddComplex = async (e) => {
    if (e) e.preventDefault();
    if (!formData.nama) return alert("Nama komplek wajib diisi");
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('perumahan')
        .insert({
          nama: formData.nama,
          alamat: formData.alamat,
          status: 'active'
        });
      
      if (error) throw error;
      
      setIsModalOpen(false);
      setFormData({ nama: "", alamat: "" });
      fetchComplexes();
    } catch (error) {
      alert("Gagal menambah komplek: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredData = complexes.filter(item => 
    item.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.alamat?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Kelola Komplek</h1>
          <p className="text-slate-500 text-sm mt-1">Manajemen seluruh perumahan dan kontrol akses sistem.</p>
        </div>
        <Button variant="primary" icon={Plus} size="md" onClick={() => setIsModalOpen(true)}>Tambah Komplek Baru</Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        <ComplexStatCard title="Total Perumahan" value={complexes.length.toString()} icon={Building2} color="blue" />
        <ComplexStatCard title="Komplek Aktif" value={complexes.filter(c => c.status !== 'suspended').length.toString()} icon={ShieldCheck} color="green" />
        <ComplexStatCard title="Komplek Suspended" value={complexes.filter(c => c.status === 'suspended').length.toString()} icon={Ban} color="red" />
      </div>

      {/* Table Card */}
      <Card noPadding>
        <CardHeader 
          title="Daftar Perumahan"
          subtitle="Database infrastruktur HABITIX secara menyeluruh"
          action={
            <div className="flex gap-4">
              <Input 
                placeholder="Cari perumahan..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={Search}
                className="w-80"
              />
              <Button variant="ghost" icon={Filter} size="sm" className="text-slate-400 uppercase tracking-widest text-[10px]" />
            </div>
          }
        />

        <Table>
          <THead>
            <TR isHeader>
              <TH>Nama Perumahan</TH>
              <TH>Lokasi & Alamat Strategis</TH>
              <TH>Unit Terdaftar</TH>
              <TH>Status Sistem</TH>
              <TH textAlign="right">Aksi Manajemen</TH>
            </TR>
          </THead>
          <TBody>
            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <TR key={i}><TD colSpan={5}><div className="h-16 bg-slate-50/50 rounded-2xl animate-pulse"></div></TD></TR>
              ))
            ) : filteredData.length === 0 ? (
              <TR>
                <TD colSpan={5} textAlign="center" className="py-32 text-[10px] font-bold tracking-[0.3em] text-slate-400 uppercase">Tidak ada data perumahan.</TD>
              </TR>
            ) : filteredData.map((item) => (
              <TR key={item.id} className={`${selectedPerumahanId === item.id ? 'bg-indigo-50/30' : ''} group transition-all`}>
                <TD>
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 duration-500 ${item.status === 'suspended' ? 'bg-slate-50 text-slate-300' : 'bg-slate-900 text-white shadow-md'}`}>
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-sm font-semibold tracking-tight leading-none mb-1.5 ${item.status === 'suspended' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                        {item.nama}
                      </span>
                      <span className="text-[10px] font-medium text-slate-400 mt-0.5">ID: {item.id.substring(0, 8).toUpperCase()}</span>
                    </div>
                  </div>
                </TD>
                <TD>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-50 rounded-lg">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <span className="text-xs text-slate-600 font-medium line-clamp-1 max-w-[200px] leading-relaxed">{item.alamat || "Alamat belum diatur"}</span>
                  </div>
                </TD>
                <TD>
                  <Badge variant="indigo">
                    {item.warga_count?.[0]?.count || 0} Unit
                  </Badge>
                </TD>
                <TD>
                  <Badge variant={item.status === 'suspended' ? 'red' : 'green'}>
                    {item.status === 'suspended' ? 'Suspended' : 'Active'}
                  </Badge>
                </TD>
                <TD textAlign="right">
                  <div className="flex justify-end gap-2">
                    <Button 
                      size="sm" 
                      variant={selectedPerumahanId === item.id ? 'primary' : 'ghost'}
                      className="font-semibold"
                      onClick={() => switchPerumahan(item.id)}
                      disabled={item.status === 'suspended'}
                    >
                      {selectedPerumahanId === item.id ? 'Aktif' : 'Pilih'}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className={`font-semibold ${item.status === 'suspended' ? 'text-green-600 hover:bg-green-50' : 'text-red-500 hover:bg-red-50'}`}
                      onClick={() => toggleSuspend(item.id, item.status)}
                      icon={item.status === 'suspended' ? CheckCircle : Ban}
                    >
                      {item.status === 'suspended' ? 'Aktifkan' : 'Bekukan'}
                    </Button>
                  </div>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>

      {/* Add Complex Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Daftarkan Komplek Baru"
      >
        <form onSubmit={handleAddComplex} className="space-y-8 p-2">
          <div className="flex items-center gap-4 bg-slate-50 p-6 rounded-xl border border-slate-100">
            <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center text-white shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Mendaftarkan komplek baru akan membuat partisi data mandiri untuk unit, warga, dan keuangan komplek tersebut.
            </p>
          </div>

          <div className="space-y-6">
            <Input 
              label="Nama Perumahan / Komplek"
              required 
              value={formData.nama} 
              onChange={(e) => setFormData({...formData, nama: e.target.value})}
              placeholder="e.g. Green Valley Residence"
              icon={Building2}
            />
            <Input 
              label="Alamat Lengkap"
              value={formData.alamat} 
              onChange={(e) => setFormData({...formData, alamat: e.target.value})}
              placeholder="Jl. Raya Utama No. 1..."
              icon={MapPin}
            />
          </div>

          <div className="flex gap-4 pt-6">
            <Button variant="ghost" type="button" className="flex-1 py-2.5 font-semibold" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button variant="primary" type="submit" className="flex-1 py-2.5 font-semibold" isLoading={isSubmitting}>
              Daftarkan Komplek
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
