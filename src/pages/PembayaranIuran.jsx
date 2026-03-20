import { useState, useEffect } from "react";
import { Plus, Search, Filter, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export default function PembayaranIuran() {
  const [data, setData] = useState([]);
  const [wargaList, setWargaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMonth, setFilterMonth] = useState("Semua");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    warga_id: "",
    bulan: new Date().toLocaleString('id-ID', { month: 'long', year: 'numeric' }),
    jumlah: 150000,
    tanggal_bayar: new Date().toISOString().split('T')[0],
    status: "Lunas"
  });

  useEffect(() => {
    fetchData();
    fetchWarga();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: payments, error } = await supabase
        .from('iuran')
        .select(`
          *,
          warga (id, nama, blok)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setData(payments || []);
    } catch (error) {
      toast.error("Gagal mengambil data iuran");
    } finally {
      setLoading(false);
    }
  };

  const fetchWarga = async () => {
    try {
      const { data: residents, error } = await supabase.from('warga').select('id, nama, blok');
      if (error) throw error;
      setWargaList(residents || []);
    } catch (error) {
      toast.error("Gagal mengambil data warga");
    }
  };

  const filteredData = data.filter(item => {
    const matchesSearch = item.warga?.nama?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         item.warga?.blok?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMonth = filterMonth === "Semua" || item.bulan === filterMonth;
    return matchesSearch && matchesMonth;
  });

  const handleOpenDialog = () => {
    setFormData({
      warga_id: "",
      bulan: new Date().toLocaleString('id-ID', { month: 'long', year: 'numeric' }),
      jumlah: 150000,
      tanggal_bayar: new Date().toISOString().split('T')[0],
      status: "Lunas"
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.warga_id) {
      toast.error("Silakan pilih warga");
      return;
    }
    try {
      const { error } = await supabase
        .from('iuran')
        .insert([formData]);
      
      if (error) throw error;
      
      toast.success("Pembayaran iuran berhasil dicatat");
      setIsDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error("Gagal mencatat iuran: " + error.message);
    }
  };

  const markAsPaid = async (id) => {
    try {
      const { error } = await supabase
        .from('iuran')
        .update({ 
          status: "Lunas", 
          tanggal_bayar: new Date().toISOString().split('T')[0] 
        })
        .eq('id', id);
      
      if (error) throw error;
      toast.success("Status diperbarui menjadi Lunas");
      fetchData();
    } catch (error) {
      toast.error("Gagal memperbarui status");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Pembayaran Iuran</h1>
          <p className="text-neutral-500">Catat dan pantau pembayaran iuran bulanan warga.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={handleOpenDialog}>
              <Plus className="h-4 w-4" />
              Catat Pembayaran
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Catat Pembayaran Iuran</DialogTitle>
              <DialogDescription>
                Masukkan data pembayaran iuran secara manual.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="warga_id" className="text-right">Warga</Label>
                  <div className="col-span-3">
                    <Select 
                      value={formData.warga_id} 
                      onValueChange={(val) => setFormData({...formData, warga_id: val})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih warga" />
                      </SelectTrigger>
                      <SelectContent>
                        {wargaList.map(w => (
                          <SelectItem key={w.id} value={w.id}>{w.nama} - {w.blok}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="bulan" className="text-right">Bulan</Label>
                  <Input 
                    id="bulan" 
                    value={formData.bulan}
                    onChange={(e) => setFormData({...formData, bulan: e.target.value})}
                    className="col-span-3"
                    placeholder="Contoh: Januari 2025"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="jumlah" className="text-right">Jumlah</Label>
                  <Input 
                    id="jumlah" 
                    type="number"
                    value={formData.jumlah || ""}
                    onChange={(e) => setFormData({...formData, jumlah: parseInt(e.target.value) || 0})}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="tanggal_bayar" className="text-right">Tanggal</Label>
                  <Input 
                    id="tanggal_bayar" 
                    type="date"
                    value={formData.tanggal_bayar}
                    onChange={(e) => setFormData({...formData, tanggal_bayar: e.target.value})}
                    className="col-span-3"
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
                <Button type="submit">Catat Pembayaran</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="flex flex-1 items-center space-x-2 bg-white p-4 rounded-lg border">
          <Search className="h-5 w-5 text-neutral-400" />
          <Input
            placeholder="Cari nama warga atau blok..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm border-0 shadow-none focus-visible:ring-0 px-0"
          />
        </div>
        <div className="flex items-center gap-2 bg-white p-4 rounded-lg border">
          <Filter className="h-4 w-4 text-neutral-400" />
          <Select value={filterMonth} onValueChange={setFilterMonth}>
            <SelectTrigger className="w-[180px] border-0 focus-visible:ring-0 shadow-none">
              <SelectValue placeholder="Semua Bulan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Semua">Semua Bulan</SelectItem>
              <SelectItem value="Januari 2025">Januari 2025</SelectItem>
              <SelectItem value="Februari 2025">Februari 2025</SelectItem>
              <SelectItem value="Maret 2025">Maret 2025</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-neutral-50/50">
              <TableHead>Nama Warga</TableHead>
              <TableHead>Blok</TableHead>
              <TableHead>Bulan</TableHead>
              <TableHead>Tanggal Bayar</TableHead>
              <TableHead className="text-right">Jumlah</TableHead>
              <TableHead className="text-right">Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <div className="flex items-center justify-center gap-2 text-neutral-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Memuat data pembayaran...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-neutral-500">
                  Tidak ada data pembayaran ditemukan.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium text-neutral-900">{item.warga?.nama}</TableCell>
                  <TableCell>{item.warga?.blok}</TableCell>
                  <TableCell>{item.bulan}</TableCell>
                  <TableCell>{item.tanggal_bayar || "-"}</TableCell>
                  <TableCell className="text-right font-medium">
                    Rp {Number(item.jumlah).toLocaleString('id-ID')}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className={
                      item.status === "Lunas" ? "bg-green-50 text-green-700 border-green-200" : 
                      item.status === "Sebagian" ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                      "bg-red-50 text-red-700 border-red-200"
                    }>
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {item.status !== "Lunas" && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-green-600 hover:text-green-700 hover:bg-green-50 gap-1"
                        onClick={() => markAsPaid(item.id)}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Tandai Lunas
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
