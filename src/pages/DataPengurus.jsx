import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Loader2 } from "lucide-react";
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

export default function DataPengurus() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    nama: "",
    jabatan: "Anggota",
    no_hp: "",
    periode: "2025-2027"
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: staff, error } = await supabase
        .from('pengurus')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      setData(staff || []);
    } catch {
      toast.error("Gagal mengambil data pengurus");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (item = null) => {
    if (item) {
      setEditingId(item.id);
      setFormData({
        nama: item.nama,
        jabatan: item.jabatan,
        no_hp: item.no_hp || "",
        periode: item.periode
      });
    } else {
      setEditingId(null);
      setFormData({
        nama: "",
        jabatan: "Anggota",
        no_hp: "",
        periode: "2025-2027"
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        const { error } = await supabase
          .from('pengurus')
          .update(formData)
          .eq('id', editingId);
        
        if (error) throw error;
        toast.success("Data pengurus berhasil diperbarui");
      } else {
        const { error } = await supabase
          .from('pengurus')
          .insert([formData]);
        
        if (error) throw error;
        toast.success("Pengurus baru berhasil ditambahkan");
      }
      setIsDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error("Kesalahan: " + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Hapus data pengurus ini?")) return;
    try {
      const { error } = await supabase
        .from('pengurus')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast.success("Data pengurus dihapus");
      fetchData();
    } catch (error) {
      toast.error("Gagal menghapus: " + error.message);
    }
  };

  const getJabatanBadgeColor = (jabatan) => {
    if (jabatan.includes("Ketua")) return "bg-blue-50 text-blue-700 border-blue-200";
    if (jabatan.includes("Sekretaris") || jabatan.includes("Bendahara")) return "bg-purple-50 text-purple-700 border-purple-200";
    return "bg-neutral-100 text-neutral-700 border-neutral-200";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Data Pengurus Paguyuban</h1>
          <p className="text-neutral-500">Kelola informasi kepengurusan RT/RW atau Paguyuban Perumahan.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4" />
              Tambah Pengurus
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Data Pengurus" : "Tambah Pengurus"}</DialogTitle>
              <DialogDescription>
                Masukkan detail informasi pengurus di sini.
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
                  <Label htmlFor="jabatan" className="text-right">Jabatan</Label>
                  <div className="col-span-3">
                    <Select value={formData.jabatan} onValueChange={(val) => setFormData({...formData, jabatan: val})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih jabatan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ketua Paguyuban">Ketua</SelectItem>
                        <SelectItem value="Wakil Ketua">Wakil Ketua</SelectItem>
                        <SelectItem value="Sekretaris">Sekretaris</SelectItem>
                        <SelectItem value="Bendahara">Bendahara</SelectItem>
                        <SelectItem value="Seksi Keamanan">Seksi Keamanan</SelectItem>
                        <SelectItem value="Seksi Lingkungan">Seksi Lingkungan</SelectItem>
                        <SelectItem value="Anggota">Anggota</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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
                  <Label htmlFor="periode" className="text-right">Periode</Label>
                  <Input 
                    id="periode" 
                    placeholder="Contoh: 2025-2027"
                    value={formData.periode}
                    onChange={(e) => setFormData({...formData, periode: e.target.value})}
                    className="col-span-3"
                    required
                  />
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

      <div className="rounded-md border bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-neutral-50/50">
              <TableHead>Nama Pengurus</TableHead>
              <TableHead>Jabatan</TableHead>
              <TableHead>No. HP</TableHead>
              <TableHead>Periode</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <div className="flex items-center justify-center gap-2 text-neutral-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Memuat data pengurus...
                  </div>
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-neutral-500">
                  Belum ada data pengurus.
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium text-neutral-900">{item.nama}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getJabatanBadgeColor(item.jabatan)}>
                      {item.jabatan}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.no_hp || "-"}</TableCell>
                  <TableCell>{item.periode}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(item)}>
                        <Edit className="h-4 w-4 text-blue-600" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
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
