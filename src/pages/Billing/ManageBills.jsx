import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Filter, CheckCircle, Clock, AlertCircle, FileText, Send, Trash2, Layers, Sparkles, Receipt } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button, Input, Card, CardHeader, Table, THead, TBody, TR, TH, TD, Badge } from "@/components/ui";
import { printInvoice, exportToPDF, exportToExcel } from "@/utils/exportUtils";

export default function ManageBills() {
  const { selectedPerumahanId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const fetchBills = useCallback(async () => {
    if (!selectedPerumahanId) return;
    try {
      setLoading(true);
      const { data: bills, error } = await supabase
        .from("tagihan")
        .select(`
          *,
          warga:warga_id(nama, blok)
        `)
        .eq("perumahan_id", selectedPerumahanId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setData(bills || []);
    } catch (err) {
      console.error("Error fetching bills:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedPerumahanId]);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  const handleGenerateBills = async () => {
    if (!window.confirm(`Generate tagihan untuk semua warga untuk bulan ${currentMonth}/${currentYear}?`)) return;
    
    setGenerating(true);
    try {
      const { data: config, error: configError } = await supabase
        .from("iuran_config")
        .select("*")
        .eq("perumahan_id", selectedPerumahanId)
        .maybeSingle();

      if (!config) throw new Error("Konfigurasi iuran belum diatur. Silakan atur di menu Iuran Config.");
      if (configError) throw configError;

      const { data: warga, error: wargaError } = await supabase
        .from("warga")
        .select("id, luas_tanah")
        .eq("perumahan_id", selectedPerumahanId)
        .eq("status_aktif", true);

      if (wargaError) throw wargaError;
      if (!warga || warga.length === 0) throw new Error("Tidak ada warga aktif untuk diberikan tagihan.");

      const newBills = warga.map(w => {
        const jumlah = config.tipe === "flat" 
          ? config.tarif_dasar 
          : (config.tarif_dasar * (w.luas_tanah || 0));
        
        return {
          warga_id: w.id,
          perumahan_id: selectedPerumahanId,
          bulan: currentMonth,
          tahun: currentYear,
          jumlah: jumlah,
          status: "Unpaid", 
          unique_code: config.use_unique_code ? Math.floor(Math.random() * 999) + 1 : 0
        };
      });

      const { error: insertError } = await supabase
        .from("tagihan")
        .insert(newBills);

      if (insertError) throw insertError;
      fetchBills();
    } catch (err) {
      alert("Gagal generate tagihan: " + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteBill = async (id) => {
    if (!window.confirm("Hapus tagihan ini secara permanen?")) return;
    try {
      const { error } = await supabase.from("tagihan").delete().eq("id", id);
      if (error) throw error;
      fetchBills();
    } catch (err) {
      alert("Gagal menghapus: " + err.message);
    }
  };

  const filteredData = data.filter(item => 
    item.warga?.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.warga?.blok?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleManualPay = async (bill) => {
    if (!window.confirm(`Catat pembayaran manual untuk ${bill.warga?.nama} periode ${bill.bulan}/${bill.tahun}?`)) return;
    
    try {
      const { error } = await supabase
        .from("tagihan")
        .update({ status: 'Paid' })
        .eq("id", bill.id);

      if (error) throw error;

      // Record in Cash Flow
      const { error: kasError } = await supabase.from('arus_kas').insert([{
        perumahan_id: selectedPerumahanId,
        tanggal: new Date().toISOString().split('T')[0],
        keterangan: `Pembayaran Manual: ${bill.warga?.nama} (${bill.bulan}/${bill.tahun})`,
        jumlah: bill.jumlah,
        kategori: 'Pemasukan'
      }]);

      if (kasError) console.error("Gagal mencatat arus kas:", kasError);
      
      fetchBills();
    } catch (err) {
      alert("Gagal memproses pembayaran manual: " + err.message);
    }
  };

  const handleExportCSV = () => {
    if (data.length === 0) return;
    const headers = ["Warga", "Blok", "Bulan", "Tahun", "Jumlah", "Status"];
    const rows = data.map(item => [
      `"${item.warga?.nama || ''}"`,
      `"${item.warga?.blok || ''}"`,
      item.bulan,
      item.tahun,
      item.jumlah,
      item.status
    ]);
    
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `laporan_tagihan_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintReceipt = (item) => {
    printInvoice(item.warga, item);
  };

  const handleExportPDF = () => {
    if (filteredData.length === 0) return;
    const headers = ["Warga", "Blok", "Bulan/Tahun", "Jumlah", "Status"];
    const rows = filteredData.map(item => [
      item.warga?.nama || "",
      item.warga?.blok || "",
      `${item.bulan}/${item.tahun}`,
      `Rp ${item.jumlah.toLocaleString('id-ID')}`,
      item.status
    ]);
    exportToPDF("Laporan Tagihan Warga", headers, rows, `laporan_tagihan_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleExportExcel = () => {
    if (filteredData.length === 0) return;
    const exportData = filteredData.map(item => ({
      "Nama Warga": item.warga?.nama || "",
      "Blok": item.warga?.blok || "",
      "Bulan": item.bulan,
      "Tahun": item.tahun,
      "Jumlah": item.jumlah,
      "Status": item.status
    }));
    exportToExcel(exportData, `laporan_tagihan_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="flex flex-col gap-4 md:gap-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Manajemen Tagihan</h1>
          <p className="text-slate-500 text-sm mt-1">Distribusi dan audit invoice bulanan untuk seluruh unit warga.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportCSV} variant="outline" icon={FileText} size="sm">CSV</Button>
          <Button onClick={handleExportPDF} variant="outline" icon={FileText} size="sm">PDF</Button>
          <Button onClick={handleExportExcel} variant="outline" icon={FileText} size="sm">Excel</Button>
          <Button
            onClick={handleGenerateBills}
            isLoading={generating}
            variant="primary"
            icon={Sparkles}
            size="md"
          >
            {generating ? "Memproses..." : `Generate ${currentMonth}/${currentYear}`}
          </Button>
        </div>
      </div>

      <Card noPadding>
        <CardHeader 
          title="Daftar Invoice" 
          subtitle="Log komprehensif seluruh invoice warga yang telah diterbitkan"
          action={
            <div className="flex gap-4">
              <Input 
                placeholder="Cari tagihan..." 
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
              <TH>Warga & Unit</TH>
              <TH>Periode Tagihan</TH>
              <TH textAlign="right">Total Tagihan</TH>
              <TH>Status</TH>
              <TH textAlign="right">Aksi</TH>
            </TR>
          </THead>
          <TBody>
            {loading ? (
              Array(6).fill(0).map((_, i) => (
                <TR key={i}><TD colSpan={5}><div className="h-16 bg-slate-50/50 rounded-2xl animate-pulse"></div></TD></TR>
              ))
            ) : filteredData.length === 0 ? (
              <TR><TD colSpan={5} textAlign="center" className="py-24 text-[10px] font-bold tracking-[0.3em] text-slate-400 uppercase">Belum ada tagihan yang dibuat untuk periode ini.</TD></TR>
            ) : filteredData.map((item) => (
              <TR key={item.id} className="group">
                <TD>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center text-slate-600 font-bold text-xs shadow-sm">
                      {item.warga?.nama?.charAt(0) || "?"}
                    </div>
                    <div className="flex flex-col">
                      <p className="text-sm font-bold text-slate-900 tracking-tight">{item.warga?.nama}</p>
                      <p className="text-[10px] font-medium text-slate-400 mt-0.5 uppercase tracking-wider">{item.warga?.blok}</p>
                    </div>
                  </div>
                </TD>
                <TD className="text-xs font-medium text-slate-500">
                  Periode {item.bulan} • {item.tahun}
                </TD>
                <TD className="text-sm font-bold text-slate-900 text-right tracking-tight">
                  Rp {item.jumlah?.toLocaleString()}
                </TD>
                <TD>
                  <Badge variant={
                    item.status === 'Paid' ? 'green' : 
                    item.status === 'Pending' ? 'orange' : 'indigo'
                  }>
                    {item.status === 'Paid' ? 'Lunas' : item.status === 'Pending' ? 'Pending' : 'Belum Bayar'}
                  </Badge>
                </TD>
                 <TD textAlign="right">
                  <div className="flex justify-end gap-1">
                    {item.status === 'Unpaid' && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        icon={CheckCircle} 
                        className="text-emerald-500 hover:bg-emerald-50" 
                        onClick={() => handleManualPay(item)}
                        title="Konfirmasi Manual"
                      />
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      icon={Receipt} 
                      className="text-slate-400 hover:text-slate-950 hover:bg-slate-50" 
                      onClick={() => handlePrintReceipt(item)}
                      title="Cetak Kuitansi"
                    />
                    <Button variant="ghost" size="sm" icon={Send} className="text-slate-400 hover:text-blue-600 hover:bg-blue-50" />
                    <Button variant="ghost" size="sm" icon={Trash2} className="text-slate-300 hover:text-red-500 hover:bg-red-50" onClick={() => handleDeleteBill(item.id)} />
                  </div>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>
    </div>
  );
}
