import { useState, useEffect, useCallback } from "react";
import { Plus, TrendingUp, TrendingDown, WalletCards, Search, MoreVertical, Filter, FileText, Edit, Trash2, ArrowUpRight, ArrowDownRight, Activity, DollarSign, PieChart, Calendar } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button, Input, Card, CardHeader, Badge, Table, THead, TBody, TR, TH, TD, Modal, Select, StatCard } from "@/components/ui";
import { SelectionRequired } from "@/components/ui/SelectionRequired";



export default function ArusKas() {
  const { selectedPerumahanId, profile } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ masuk: 0, keluar: 0, saldo: 0 });
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    keterangan: "",
    kategori: "Pemasukan",
    jumlah: 0
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      if (!selectedPerumahanId) return;

      const { data: transactions, error } = await supabase
        .from('arus_kas')
        .select('*')
        .eq('perumahan_id', selectedPerumahanId)
        .order('tanggal', { ascending: false });
      
      if (error) throw error;
      
      setData(transactions || []);

      const masuk = transactions?.filter(t => t.kategori === "Pemasukan").reduce((acc, curr) => acc + curr.jumlah, 0) || 0;
      const keluar = transactions?.filter(t => t.kategori === "Pengeluaran").reduce((acc, curr) => acc + curr.jumlah, 0) || 0;
      setSummary({ masuk, keluar, saldo: masuk - keluar });
    } catch (err) {
      console.error("Gagal memuat data:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedPerumahanId]);

  const handleEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      tanggal: item.tanggal,
      keterangan: item.keterangan || "",
      kategori: item.kategori || "Pemasukan",
      jumlah: item.jumlah || 0
    });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleExportCSV = () => {
    if (data.length === 0) return;
    const headers = ["Tanggal", "Keterangan", "Kategori", "Jumlah"];
    const rows = data.map(item => [
      item.tanggal,
      `"${item.keterangan}"`,
      item.kategori,
      item.jumlah
    ]);
    
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `arus_kas_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddTransaction = async (e) => {
    if (e) e.preventDefault();
    if (!selectedPerumahanId) return;
    setIsSubmitting(true);
    try {
      if (isEditMode) {
        const { error } = await supabase
          .from('arus_kas')
          .update(formData)
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('arus_kas')
          .insert([{ 
            ...formData, 
            perumahan_id: selectedPerumahanId
          }]);
        if (error) throw error;
      }
      
      setIsModalOpen(false);
      setIsEditMode(false);
      setEditingId(null);
      setFormData({ 
        tanggal: new Date().toISOString().split('T')[0], 
        keterangan: "", 
        kategori: "Pemasukan", 
        jumlah: 0 
      });
      fetchData();
    } catch (err) {
      alert("Gagal menyimpan transaksi: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Hapus transaksi ini secara permanen?")) return;
    try {
      const { error } = await supabase.from('arus_kas').delete().eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (err) {
      alert("Gagal menghapus: " + err.message);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredData = data.filter(item => 
    item.keterangan?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (profile?.role === 'super_admin' && !selectedPerumahanId) {
    return <SelectionRequired />;
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Arus Kas & Keuangan</h1>
          <p className="text-slate-500 text-sm mt-1">Pantau seluruh pemasukan dan pengeluaran operasional perumahan.</p>
        </div>
        {profile?.role !== 'warga' && (
          <div className="flex items-center gap-3">
            <Button variant="ghost" icon={FileText} onClick={handleExportCSV} className="text-slate-500 font-semibold hover:bg-slate-50">Ekspor Laporan</Button>
            <Button variant="primary" size="md" icon={Plus} onClick={() => {
              setIsEditMode(false);
              setEditingId(null);
              setFormData({ tanggal: new Date().toISOString().split('T')[0], keterangan: "", kategori: "Pemasukan", jumlah: 0 });
              setIsModalOpen(true);
            }}>Input Transaksi</Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <StatCard title="Total Pemasukan" value={`Rp ${summary.masuk.toLocaleString()}`} icon={ArrowUpRight} isPositive={true} change="Uang Masuk" />
        <StatCard title="Total Pengeluaran" value={`Rp ${summary.keluar.toLocaleString()}`} icon={ArrowDownRight} isPositive={false} change="Uang Keluar" />
        <StatCard title="Saldo Kas Saat Ini" value={`Rp ${summary.saldo.toLocaleString()}`} icon={WalletCards} isPositive={summary.saldo >= 0} change="Saldo Efektif" />
      </div>

      <Card noPadding>
        <CardHeader 
          title="Riwayat Transaksi"
          subtitle="Daftar lengkap seluruh pergerakan dana yang telah tervalidasi"
          action={
            <div className="flex gap-4">
              <Input 
                placeholder="Cari transaksi..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={Search}
                className="w-80"
              />
            </div>
          }
        />

        <Table>
          <THead>
            <TR isHeader>
              <TH>Tanggal</TH>
              <TH>Keterangan</TH>
              <TH>Klasifikasi</TH>
              <TH textAlign="right">Jumlah</TH>
              {profile?.role !== 'warga' && <TH textAlign="right">Aksi</TH>}
            </TR>
          </THead>
          <TBody>
            {loading ? (
              Array(6).fill(0).map((_, i) => (
                <TR key={i}><TD colSpan={5}><div className="h-16 bg-slate-50/50 rounded-2xl animate-pulse"></div></TD></TR>
              ))
            ) : filteredData.length === 0 ? (
              <TR>
                <TD colSpan={5} textAlign="center" className="py-24 text-[10px] font-bold tracking-[0.3em] text-slate-400 uppercase">Tidak ada data transaksi ditemukan.</TD>
              </TR>
            ) : filteredData.map((item) => (
              <TR key={item.id} className="group">
                <TD className="text-xs font-medium text-slate-500">
                  {new Date(item.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                </TD>
                <TD>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-900 tracking-tight">{item.keterangan}</span>
                    <span className="text-[10px] font-medium text-slate-400 mt-0.5">TXN: {item.id.substring(0, 12)}</span>
                  </div>
                </TD>
                <TD>
                  <Badge variant={item.kategori === "Pemasukan" ? 'green' : 'red'}>
                    {item.kategori === "Pemasukan" ? 'Pemasukan' : 'Pengeluaran'}
                  </Badge>
                </TD>
                <TD className={`text-sm font-bold text-right tracking-tight ${item.kategori === "Pemasukan" ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {item.kategori === "Pemasukan" ? '+' : '-'} Rp {item.jumlah?.toLocaleString()}
                </TD>
                {profile?.role !== 'warga' && (
                  <TD textAlign="right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" icon={Edit} onClick={() => handleEdit(item)} className="text-slate-400 hover:text-slate-950 hover:bg-slate-50" />
                      <Button variant="ghost" size="sm" icon={Trash2} onClick={() => handleDelete(item.id)} className="text-slate-300 hover:text-red-500 hover:bg-red-50" />
                    </div>
                  </TD>
                )}
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={isEditMode ? "Ubah Transaksi" : "Input Transaksi Baru"}
      >
        <div className="space-y-8 p-2">
          <div className="flex items-center gap-4 bg-slate-50 p-6 rounded-xl border border-slate-100">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">Pastikan seluruh nominal yang dimasukkan telah sesuai dengan bukti fisik transaksi.</p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <Input 
              label="Tanggal Transaksi"
              type="date"
              required 
              value={formData.tanggal} 
              onChange={(e) => setFormData({...formData, tanggal: e.target.value})}
              icon={Calendar}
            />
            <Select 
              label="Tipe Aliran Dana"
              value={formData.kategori}
              onChange={(e) => setFormData({...formData, kategori: e.target.value})}
            >
              <option value="Pemasukan">Pemasukan (Uang Masuk)</option>
              <option value="Pengeluaran">Pengeluaran (Uang Keluar)</option>
            </Select>
          </div>
          
          <Input 
            label="Keterangan"
            required 
            value={formData.keterangan} 
            onChange={(e) => setFormData({...formData, keterangan: e.target.value})}
            placeholder="Contoh: Biaya Perbaikan Taman"
            icon={FileText}
          />

          <Input 
            label="Jumlah (Rp)"
            type="number"
            required 
            value={formData.jumlah} 
            onChange={(e) => setFormData({...formData, jumlah: parseInt(e.target.value) || 0})}
            placeholder="0"
            icon={DollarSign}
          />

          <div className="flex gap-4 pt-6">
            <Button variant="ghost" className="flex-1 py-2.5 font-semibold" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button variant="primary" className="flex-1 py-2.5 font-semibold" onClick={handleAddTransaction} isLoading={isSubmitting}>
              {isEditMode ? "Simpan Perubahan" : "Konfirmasi Transaksi"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
