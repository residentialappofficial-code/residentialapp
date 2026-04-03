import { useState, useEffect, useMemo } from "react";
import { Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export default function Penggajian() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    nama_pegawai: "",
    jabatan: "",
    gaji_pokok: 0,
    tunjangan: 0,
    potongan: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: payroll, error } = await supabase
        .from('penggajian')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      setData(payroll || []);
    } catch {
      toast.error("Gagal mengambil data gaji");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (item = null) => {
    if (item) {
      setEditingId(item.id);
      setFormData({
        nama_pegawai: item.nama_pegawai,
        jabatan: item.jabatan,
        gaji_pokok: item.gaji_pokok,
        tunjangan: item.tunjangan,
        potongan: item.potongan,
      });
    } else {
      setEditingId(null);
      setFormData({
        nama_pegawai: "",
        jabatan: "",
        gaji_pokok: 0,
        tunjangan: 0,
        potongan: 0,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const gaji_bersih = formData.gaji_pokok + formData.tunjangan - formData.potongan;
      const saveObj = { ...formData, gaji_bersih };

      if (editingId) {
        const { error } = await supabase
          .from('penggajian')
          .update(saveObj)
          .eq('id', editingId);
        if (error) throw error;
        toast.success("Data penggajian diperbarui");
      } else {
        const { error } = await supabase
          .from('penggajian')
          .insert([saveObj]);
        if (error) throw error;
        toast.success("Pegawai baru ditambahkan");
      }
      setIsDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error("Kesalahan: " + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Hapus data ini?")) return;
    try {
      const { error } = await supabase
        .from('penggajian')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success("Data dihapus");
      fetchData();
    } catch {
      toast.error("Gagal menghapus");
    }
  };

  const totalGajiBulanIni = useMemo(() => {
    return data.reduce((acc, curr) => acc + Number(curr.gaji_bersih), 0);
  }, [data]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Penggajian Staf</h1>
          <p className="text-neutral-500">Rekap dan manajemen gaji satpam, petugas kebersihan, dll.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4" />
              Tambah Pegawai
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Data Penggajian" : "Tambah Pegawai"}</DialogTitle>
              <DialogDescription>
                Masukkan komponen gaji pegawai. Gaji bersih dihitung otomatis.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="nama_pegawai" className="text-right">Nama</Label>
                  <Input 
                    id="nama_pegawai" 
                    value={formData.nama_pegawai}
                    onChange={(e) => setFormData({...formData, nama_pegawai: e.target.value})}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="jabatan" className="text-right">Posisi</Label>
                  <Input 
                    id="jabatan" 
                    placeholder="Contoh: Satpam"
                    value={formData.jabatan}
                    onChange={(e) => setFormData({...formData, jabatan: e.target.value})}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4 mt-2">
                  <Label htmlFor="gaji_pokok" className="text-right">Gaji Pokok</Label>
                  <Input 
                    id="gaji_pokok" 
                    type="number"
                    value={formData.gaji_pokok || ""}
                    onChange={(e) => setFormData({...formData, gaji_pokok: parseInt(e.target.value) || 0})}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="tunjangan" className="text-right">Tunjangan</Label>
                  <Input 
                    id="tunjangan" 
                    type="number"
                    value={formData.tunjangan || ""}
                    onChange={(e) => setFormData({...formData, tunjangan: parseInt(e.target.value) || 0})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="potongan" className="text-right">Potongan</Label>
                  <Input 
                    id="potongan" 
                    type="number"
                    value={formData.potongan || ""}
                    onChange={(e) => setFormData({...formData, potongan: parseInt(e.target.value) || 0})}
                    className="col-span-3"
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

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Total Beban Gaji Bulan Ini</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-red-600">
            Rp {totalGajiBulanIni.toLocaleString('id-ID')}
          </div>
        </CardContent>
      </Card>

      <div className="rounded-md border bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-neutral-50/50">
              <TableHead>Nama Pegawai</TableHead>
              <TableHead>Jabatan</TableHead>
              <TableHead className="text-right">Gaji Pokok</TableHead>
              <TableHead className="text-right">Tunjangan</TableHead>
              <TableHead className="text-right">Potongan</TableHead>
              <TableHead className="text-right font-bold text-neutral-900">Gaji Bersih</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-neutral-500">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Memuat data...
                  </div>
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-neutral-500">
                  Tidak ada data pegawai.
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium text-neutral-900">{item.nama_pegawai}</TableCell>
                  <TableCell>{item.jabatan}</TableCell>
                  <TableCell className="text-right text-neutral-500">Rp {item.gaji_pokok.toLocaleString('id-ID')}</TableCell>
                  <TableCell className="text-right text-neutral-500">Rp {item.tunjangan.toLocaleString('id-ID')}</TableCell>
                  <TableCell className="text-right text-red-500">Rp {item.potongan.toLocaleString('id-ID')}</TableCell>
                  <TableCell className="text-right font-bold text-neutral-900 border-l">
                    Rp {item.gaji_bersih.toLocaleString('id-ID')}
                  </TableCell>
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
