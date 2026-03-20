import { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, Loader2 } from "lucide-react";
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

export default function DataWarga() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({
    nama: "",
    blok: "",
    no_hp: "",
    status_hunian: "Pemilik",
    status_iuran: "Belum Bayar"
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: residents, error } = await supabase
        .from('warga')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      setData(residents || []);
    } catch (error) {
      console.error('Error fetching data:', error.message);
      toast.error("Gagal mengambil data dari database");
    } finally {
      setLoading(false);
    }
  };

  const filteredData = data.filter(item => 
    item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.blok.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenDialog = (item = null) => {
    if (item) {
      setEditingId(item.id);
      setFormData({
        nama: item.nama,
        blok: item.blok,
        no_hp: item.no_hp || "",
        status_hunian: item.status_hunian,
        status_iuran: item.status_iuran
      });
    } else {
      setEditingId(null);
      setFormData({
        nama: "",
        blok: "",
        no_hp: "",
        status_hunian: "Pemilik",
        status_iuran: "Belum Bayar"
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        const { error } = await supabase
          .from('warga')
          .update(formData)
          .eq('id', editingId);
        
        if (error) throw error;
        toast.success("Data warga berhasil diperbarui");
      } else {
        const { error } = await supabase
          .from('warga')
          .insert([formData]);
        
        if (error) throw error;
        toast.success("Warga baru berhasil ditambahkan");
      }
      setIsDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error("Terjadi kesalahan: " + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data ini?")) return;
    
    try {
      const { error } = await supabase
        .from('warga')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast.success("Data warga dihapus");
      fetchData();
    } catch (error) {
      toast.error("Gagal menghapus data: " + error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Data Warga</h1>
          <p className="text-neutral-500">Kelola informasi warga, status hunian, dan iuran.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4" />
              Tambah Warga
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Data Warga" : "Tambah Warga Baru"}</DialogTitle>
              <DialogDescription>
                Masukkan detail informasi warga di sini. Klik simpan setelah selesai.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="nama" className="text-right">Nama</Label>
                  <Input 
                    id="nama" 
                    value={formData.nama}
                    onChange={(e) => setFormData({...formData, nama: e.target.value})}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="blok" className="text-right">Blok/No</Label>
                  <Input 
                    id="blok" 
                    placeholder="Contoh: A-12"
                    value={formData.blok}
                    onChange={(e) => setFormData({...formData, blok: e.target.value})}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="no_hp" className="text-right">No. HP</Label>
                  <Input 
                    id="no_hp" 
                    value={formData.no_hp}
                    onChange={(e) => setFormData({...formData, no_hp: e.target.value})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="status_hunian" className="text-right">Status</Label>
                  <div className="col-span-3">
                    <Select value={formData.status_hunian} onValueChange={(val) => setFormData({...formData, status_hunian: val})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih status hunian" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pemilik">Pemilik</SelectItem>
                        <SelectItem value="Kontrak">Kontrak</SelectItem>
                        <SelectItem value="Kos">Kos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
                <Button type="submit">Simpan Data</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-2 bg-white p-4 rounded-lg border">
        <Search className="h-5 w-5 text-neutral-400" />
        <Input
          placeholder="Cari nama atau blok rumah..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm border-0 shadow-none focus-visible:ring-0 px-0"
        />
      </div>

      <div className="rounded-md border bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-neutral-50/50">
              <TableHead className="w-[50px]">No</TableHead>
              <TableHead>Nama Warga</TableHead>
              <TableHead>Blok/No</TableHead>
              <TableHead>No. HP</TableHead>
              <TableHead>Status Hunian</TableHead>
              <TableHead>Status Iuran</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <div className="flex items-center justify-center gap-2 text-neutral-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Memuat data warga...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-neutral-500">
                  Tidak ada data warga ditemukan.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((warga, index) => (
                <TableRow key={warga.id}>
                  <TableCell className="font-medium text-neutral-500">{index + 1}</TableCell>
                  <TableCell className="font-medium text-neutral-900">{warga.nama}</TableCell>
                  <TableCell>{warga.blok}</TableCell>
                  <TableCell>{warga.no_hp || "-"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={
                      warga.status_hunian === "Pemilik" ? "bg-blue-50 text-blue-700 border-blue-200" : 
                      "bg-orange-50 text-orange-700 border-orange-200"
                    }>
                      {warga.status_hunian}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={
                      warga.status_iuran === "Lunas" ? "bg-green-50 text-green-700 border-green-200" : 
                      warga.status_iuran === "Sebagian" ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                      "bg-red-50 text-red-700 border-red-200"
                    }>
                      {warga.status_iuran || "Belum Bayar"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(warga)}>
                        <Edit className="h-4 w-4 text-blue-600" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(warga.id)}>
                        <Trash2 className="h-4 w-4 text-red-600" />
                        <span className="sr-only">Hapus</span>
                      </Button>
                    </div>
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
