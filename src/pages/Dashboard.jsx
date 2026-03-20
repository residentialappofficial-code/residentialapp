import { useState, useEffect } from "react";
import { 
  Users, 
  Banknote, 
  WalletCards, 
  UserCog, 
  ArrowUpRight, 
  ArrowDownRight,
  PlusCircle,
  ReceiptText,
  MessageSquarePlus,
  Loader2
} from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/lib/supabase";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalWarga: 0,
    iuranBulanIni: 0,
    saldoKas: 0,
    totalPengurus: 0,
  });
  const [recentPayments, setRecentPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // 1. Total Warga
      const { count: wargaCount } = await supabase
        .from('warga')
        .select('*', { count: 'exact', head: true });

      // 2. Total Pengurus
      const { count: pengurusCount } = await supabase
        .from('pengurus')
        .select('*', { count: 'exact', head: true });

      // 3. Saldo Terakhir dari Arus Kas
      const { data: lastKas } = await supabase
        .from('arus_kas')
        .select('saldo_after')
        .order('created_at', { ascending: false })
        .limit(1);

      // 4. Iuran Bulan Ini (Sum)
      const currentMonth = new Date().toLocaleString('id-ID', { month: 'long', year: 'numeric' });
      const { data: iuranData } = await supabase
        .from('iuran')
        .select('jumlah')
        .eq('bulan', currentMonth)
        .eq('status', 'Lunas');
      
      const totalIuran = iuranData?.reduce((acc, curr) => acc + Number(curr.jumlah), 0) || 0;

      // 5. Recent Payments with join to warga
      const { data: payments } = await supabase
        .from('iuran')
        .select(`
          id,
          jumlah,
          tanggal_bayar,
          status,
          warga (nama, blok)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      setStats({
        totalWarga: wargaCount || 0,
        iuranBulanIni: totalIuran,
        saldoKas: lastKas?.[0]?.saldo_after || 0,
        totalPengurus: pengurusCount || 0,
      });
      setRecentPayments(payments || []);

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Dashboard Paguyuban</h1>
        <p className="text-neutral-500">Selamat datang kembali! Berikut ringkasan pengelolaan perumahan hari ini.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white border-l-4 border-l-blue-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Warga</CardTitle>
            <Users className="h-4 w-4 text-neutral-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin text-neutral-300" />
            ) : (
              <div className="text-2xl font-bold">{stats.totalWarga}</div>
            )}
            <p className="text-xs text-neutral-500 mt-1">Jiwa terdaftar dalam sistem</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-l-4 border-l-green-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Iuran Bulan Ini</CardTitle>
            <Banknote className="h-4 w-4 text-neutral-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin text-neutral-300" />
            ) : (
              <div className="text-2xl font-bold">Rp {stats.iuranBulanIni.toLocaleString('id-ID')}</div>
            )}
            <p className="text-xs text-green-600 mt-1 font-medium">Status: Lancar</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-l-4 border-l-amber-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Kas</CardTitle>
            <WalletCards className="h-4 w-4 text-neutral-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin text-neutral-300" />
            ) : (
              <div className="text-2xl font-bold text-neutral-900">Rp {stats.saldoKas.toLocaleString('id-ID')}</div>
            )}
            <p className="text-xs text-neutral-500 mt-1">Saldo tersedia di rekening</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-l-4 border-l-indigo-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pengurus</CardTitle>
            <UserCog className="h-4 w-4 text-neutral-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin text-neutral-300" />
            ) : (
              <div className="text-2xl font-bold">{stats.totalPengurus}</div>
            )}
            <p className="text-xs text-neutral-500 mt-1">Aktif menjalankan paguyuban</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-7 lg:grid-cols-5">
        <Card className="md:col-span-4 lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ReceiptText className="h-5 w-5 text-blue-600" />
              Pembayaran Terakhir
            </CardTitle>
            <CardDescription>
              Transaksi iuran masuk terbaru dari warga.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-neutral-300" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Warga</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-neutral-500 py-4">Belum ada pembayaran.</TableCell>
                    </TableRow>
                  ) : (
                    recentPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          <div className="font-medium">{payment.warga?.nama || "Warga"}</div>
                          <div className="text-xs text-neutral-500">Blok {payment.warga?.blok || "-"}</div>
                        </TableCell>
                        <TableCell className="text-right font-medium">Rp {payment.jumlah.toLocaleString('id-ID')}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className={payment.status === "Lunas" ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}>
                            {payment.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
          <CardFooter className="border-t bg-neutral-50/50 py-3">
            <Button variant="ghost" size="sm" className="w-full text-blue-600 font-semibold" asChild>
              <Link to="/iuran">Lihat Semua Iuran</Link>
            </Button>
          </CardFooter>
        </Card>

        <div className="md:col-span-3 lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Arus Kas (Sisa Saldo)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between pt-2">
                <span className="text-sm font-bold">Total Saldo</span>
                <span className="font-bold text-blue-600 text-xl">Rp {stats.saldoKas.toLocaleString('id-ID')}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Tindakan Cepat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="secondary" className="w-full justify-start gap-2" asChild>
                <Link to="/forum">
                  <MessageSquarePlus className="h-4 w-4" />
                  Buat Pengumuman Forum
                </Link>
              </Button>
              <Button variant="secondary" className="w-full justify-start gap-2" asChild>
                <Link to="/kas">
                  <WalletCards className="h-4 w-4" />
                  Tambah Catatan Kas
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
