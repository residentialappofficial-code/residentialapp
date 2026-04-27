import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Building2, ShieldCheck, Users, Search, MoreHorizontal, Filter, MapPin, Layers, CheckCircle, Ban } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button, Input, Card, CardHeader, Badge, Table, THead, TBody, TR, TH, TD } from "@/components/ui";

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
    <div className="bg-transparent">
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Kelola Komplek</h1>
            <p className="text-slate-500 text-sm font-medium">Manajemen seluruh perumahan dan kontrol akses sistem.</p>
          </div>
          <Button variant="primary" icon={Plus}>Tambah Komplek Baru</Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{complexes.length}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Perumahan</p>
            </div>
          </Card>
          <Card className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-600">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {complexes.filter(c => c.status !== 'suspended').length}
              </p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Komplek Aktif</p>
            </div>
          </Card>
          <Card className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center text-red-600">
              <Ban className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {complexes.filter(c => c.status === 'suspended').length}
              </p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Komplek Suspended</p>
            </div>
          </Card>
        </div>

        {/* Table Card */}
        <Card noPadding>
          <CardHeader 
            title="Daftar Perumahan"
            action={
              <Input 
                placeholder="Cari perumahan..." 
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
                <TH>Nama Perumahan</TH>
                <TH>Lokasi</TH>
                <TH>Unit & Warga</TH>
                <TH>Status</TH>
                <TH textAlign="right">Aksi Manajemen</TH>
              </TR>
            </THead>
            <TBody>
              {loading ? (
                Array(3).fill(0).map((_, i) => (
                  <TR key={i}><TD colSpan={5}><div className="h-6 bg-slate-100 rounded animate-pulse"></div></TD></TR>
                ))
              ) : filteredData.map((item) => (
                <TR key={item.id} className={selectedPerumahanId === item.id ? 'bg-indigo-50/30' : ''}>
                  <TD>
                    <div className="flex items-center gap-4">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${item.status === 'suspended' ? 'bg-slate-100 text-slate-400' : 'bg-indigo-50 text-indigo-600'}`}>
                        <Building2 className="w-5 h-5" />
                      </div>
                      <span className={`text-sm font-bold ${item.status === 'suspended' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                        {item.nama}
                      </span>
                    </div>
                  </TD>
                  <TD>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs text-slate-600 font-semibold">{item.alamat || "Indonesia"}</span>
                    </div>
                  </TD>
                  <TD>
                    <div className="flex flex-col gap-1">
                      <Badge variant="slate">{item.warga_count?.[0]?.count || 0} Warga</Badge>
                    </div>
                  </TD>
                  <TD>
                    <Badge variant={item.status === 'suspended' ? 'red' : 'green'}>
                      {item.status || 'active'}
                    </Badge>
                  </TD>
                  <TD textAlign="right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        size="xs" 
                        variant={selectedPerumahanId === item.id ? 'dark' : 'outline'}
                        onClick={() => switchPerumahan(item.id)}
                        disabled={item.status === 'suspended'}
                      >
                        {selectedPerumahanId === item.id ? 'Selected' : 'Select'}
                      </Button>
                      <Button 
                        size="xs" 
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
    </div>
  );
}
