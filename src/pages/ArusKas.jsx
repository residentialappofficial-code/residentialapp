import { useState, useEffect, useMemo } from "react";
import { Plus, ArrowUpRight, ArrowDownRight, WalletCards, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export default function ArusKas() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    keterangan: "",
    kategori: "Pemasukan",
    jumlah: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: transactions, error } = await supabase
        .from('arus_kas')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setData(transactions || []);
    } catch (error) {
      toast.error("Gagal mengambil data arus kas");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = () => {
    setFormData({
      tanggal: new Date().toISOString().split('T')[0],
      keterangan: "",
      kategori: "Pemasukan",
      jumlah: 0,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Get current balance (top row since it's ordered by descending created_at)
      const lastSaldo = data.length > 0 ? data[0].saldo_after : 0;
      const newSaldo = formData.kategori === "Pemasukan" 
        ? lastSaldo + formData.jumlah 
        : lastSaldo - formData.jumlah;

      const { error } = await supabase
        .from('arus_kas')
        .insert([{ 
          ...formData, 
          saldo_after: newSaldo 
        }]);
      
      if (error) throw error;
      
      toast.success("Catatan kas berhasil ditambahkan");
      setIsDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error("Kesalahan: " + error.message);
    }
  };

  const summary = useMemo(() => {
    const sum = data.reduce((acc, curr) => {
      if (curr.kategori === "Pemasukan") acc.pemasukan += Number(curr.jumlah);
      if (curr.kategori === "Pengeluaran") acc.pengeluaran += Number(curr.jumlah);
      return acc;
    }, { pemasukan: 0, pengeluaran: 0 });
    
    sum.saldo = data.length > 0 ? data[0].saldo_after : 0;
    return sum;
  }, [data]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Arus Kas</h1>
          <p className="text-neutral-500">Pencatatan pemasukan dan pengeluaran keuangan paguyuban.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={handleOpenDialog}>
              <Plus className="h-4 w-4" />
              Catat Transaksi
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Catat Transaksi Kas</DialogTitle>
              <DialogDescription>
                Masukkan detail transaksi (pemasukan atau pengeluaran).
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="tanggal" className="text-right">Tanggal</Label>
                  <Input 
                    id="tanggal" 
                    type="date"
                    value={formData.tanggal}
                    onChange={(e) => setFormData({...formData, tanggal: e.target.value})}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="kategori" className="text-right">Kategori</Label>
                  <div className="col-span-3">
                    <Select value={formData.kategori} onValueChange={(val) => setFormData({...formData, kategori: val})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih kategori" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pemasukan">Pemasukan</SelectItem>
                        <SelectItem value="Pengeluaran">Pengeluaran</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="keterangan" className="text-right">Keterangan</Label>
                  <Input 
                    id="keterangan" 
                    value={formData.keterangan}
                    onChange={(e) => setFormData({...formData, keterangan: e.target.value})}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="jumlah" className="text-right">Jumlah (Rp)</Label>
                  <Input 
                    id="jumlah" 
                    type="number"
                    value={formData.jumlah || ""}
                    onChange={(e) => setFormData({...formData, jumlah: parseInt(e.target.value) || 0})}
                    className="col-span-3"
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
                <Button type="submit">Simpan Transaksi</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pemasukan</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              Rp {summary.pemasukan.toLocaleString('id-ID')}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pengeluaran</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              Rp {summary.pengeluaran.toLocaleString('id-ID')}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Kas Saat Ini</CardTitle>
            <WalletCards className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neutral-900">
              Rp {summary.saldo.toLocaleString('id-ID')}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-md border bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-neutral-50/50">
              <TableHead>Tanggal</TableHead>
              <TableHead>Keterangan</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead className="text-right">Jumlah</TableHead>
              <TableHead className="text-right">Sisa Saldo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <div className="flex items-center justify-center gap-2 text-neutral-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Memuat data kas...
                  </div>
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-neutral-500">
                  Belum ada catatan transaksi kas.
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="w-[120px]">{item.tanggal}</TableCell>
                  <TableCell className="font-medium text-neutral-900">{item.keterangan}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={
                      item.kategori === "Pemasukan" ? "bg-green-50 text-green-700 border-green-200" : 
                      "bg-red-50 text-red-700 border-red-200"
                    }>
                      {item.kategori}
                    </Badge>
                  </TableCell>
                  <TableCell className={`text-right font-medium ${item.kategori === "Pemasukan" ? "text-green-600" : "text-red-600"}`}>
                    {item.kategori === "Pemasukan" ? "+" : "-"} Rp {Number(item.jumlah).toLocaleString('id-ID')}
                  </TableCell>
                  <TableCell className="text-right font-bold text-neutral-900">
                    Rp {Number(item.saldo_after).toLocaleString('id-ID')}
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
