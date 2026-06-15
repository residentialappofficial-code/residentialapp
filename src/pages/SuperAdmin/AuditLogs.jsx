import { useState, useEffect, useCallback } from "react";
import { Shield, Clock, FileText, Activity, Search, ArrowLeft, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Card, CardHeader, Table, THead, TBody, TR, TH, TD, Badge, Button, Input, Select } from "@/components/ui";

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 20;

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('audit_logs')
        .select('*, user:user_id(email)', { count: 'exact' });

      if (actionFilter) {
        query = query.eq('action', actionFilter);
      }
      if (entityFilter) {
        query = query.eq('entity', entityFilter);
      }
      if (startDate) {
        query = query.gte('created_at', `${startDate}T00:00:00Z`);
      }
      if (endDate) {
        query = query.lte('created_at', `${endDate}T23:59:59Z`);
      }

      // Pagination
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      setLogs(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      console.error("Gagal memuat audit logs:", err);
    } finally {
      setLoading(false);
    }
  }, [actionFilter, entityFilter, startDate, endDate, currentPage]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [actionFilter, entityFilter, startDate, endDate]);

  const totalPages = Math.ceil(totalCount / itemsPerPage) || 1;

  const formatDetails = (log) => {
    if (!log.details) return "-";
    const { old: oldVal, new: newVal } = log.details;
    
    if (log.action === 'INSERT' || log.action === 'CREATE') {
      if (log.entity === 'warga') return `Menambahkan warga baru: ${newVal?.nama} (Blok ${newVal?.blok})`;
      if (log.entity === 'tagihan') return `Penerbitan tagihan: Periode ${newVal?.bulan}/${newVal?.tahun} sebesar Rp ${(newVal?.jumlah || 0).toLocaleString('id-ID')}`;
      if (log.entity === 'arus_kas') return `Pencatatan kas ${newVal?.kategori}: "${newVal?.keterangan}" sebesar Rp ${(newVal?.jumlah || 0).toLocaleString('id-ID')}`;
      if (log.entity === 'pengurus') return `Menambahkan pengurus baru: ${newVal?.jabatan}`;
      return `Menambahkan entitas ${log.entity}`;
    }
    
    if (log.action === 'DELETE') {
      if (log.entity === 'warga') return `Menghapus warga: ${oldVal?.nama} (Blok ${oldVal?.blok})`;
      if (log.entity === 'tagihan') return `Menghapus tagihan: Periode ${oldVal?.bulan}/${oldVal?.tahun} sebesar Rp ${(oldVal?.jumlah || 0).toLocaleString('id-ID')}`;
      if (log.entity === 'arus_kas') return `Menghapus pencatatan kas: "${oldVal?.keterangan}"`;
      if (log.entity === 'pengurus') return `Menghapus pengurus: ${oldVal?.jabatan}`;
      return `Menghapus entitas ${log.entity}`;
    }
    
    if (log.action === 'UPDATE') {
      if (!oldVal || !newVal) return "Memperbarui data";
      const changes = [];
      Object.keys(newVal).forEach(key => {
        if (newVal[key] !== oldVal[key] && key !== 'updated_at' && key !== 'created_at' && key !== 'user_id') {
          changes.push(`${key}: "${oldVal[key] ?? ''}" → "${newVal[key] ?? ''}"`);
        }
      });
      return changes.length > 0 
        ? `Mengubah data (${changes.slice(0, 3).join(', ')}${changes.length > 3 ? '...' : ''})` 
        : "Memperbarui data tanpa perubahan nilai";
    }
    
    return JSON.stringify(log.details);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Shield className="w-6 h-6 text-indigo-600" /> Audit Trail
        </h1>
        <p className="text-slate-500 text-sm mt-1">Sistem pencatatan log aktivitas dan perubahan data secara realtime.</p>
      </div>

      {/* Filters Box */}
      <Card>
        <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Aksi</label>
            <Select 
              value={actionFilter} 
              onChange={(e) => setActionFilter(e.target.value)}
              options={[
                { value: "", label: "Semua Aksi" },
                { value: "INSERT", label: "INSERT / CREATE" },
                { value: "UPDATE", label: "UPDATE" },
                { value: "DELETE", label: "DELETE" }
              ]}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Entitas / Tabel</label>
            <Select 
              value={entityFilter} 
              onChange={(e) => setEntityFilter(e.target.value)}
              options={[
                { value: "", label: "Semua Entitas" },
                { value: "warga", label: "Warga" },
                { value: "tagihan", label: "Tagihan" },
                { value: "arus_kas", label: "Arus Kas" },
                { value: "pengurus", label: "Pengurus" }
              ]}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Mulai Tanggal</label>
            <Input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Sampai Tanggal</label>
            <Input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
      </Card>

      <Card noPadding>
        <CardHeader 
          title={`Riwayat Aktivitas (${totalCount} tercatat)`} 
          subtitle="Audit log mencatat setiap perubahan data yang dilakukan oleh pengurus komplek"
          action={<Button variant="outline" size="sm" onClick={fetchLogs} icon={Activity}>Refresh Data</Button>}
        />
        <Table>
          <THead>
            <TR isHeader>
              <TH>Waktu</TH>
              <TH>Pengguna</TH>
              <TH>Aksi</TH>
              <TH>Entitas</TH>
              <TH>Aktivitas / Perubahan</TH>
            </TR>
          </THead>
          <TBody>
            {loading ? (
              <TR><TD colSpan={5} className="text-center py-8 text-slate-400 animate-pulse">Memuat log...</TD></TR>
            ) : logs.length === 0 ? (
              <TR><TD colSpan={5} className="text-center py-8 text-slate-400">Belum ada log aktivitas yang cocok dengan filter.</TD></TR>
            ) : logs.map((log) => (
              <TR key={log.id} className="hover:bg-slate-50/50">
                <TD className="text-xs text-slate-500 whitespace-nowrap">
                  {new Date(log.created_at).toLocaleString('id-ID')}
                </TD>
                <TD className="text-sm font-medium text-slate-800">
                  {log.user?.email || 'System / Webhook'}
                </TD>
                <TD>
                  <Badge variant={
                    log.action === 'INSERT' || log.action === 'CREATE' ? 'green' : 
                    log.action === 'UPDATE' ? 'orange' : 
                    log.action === 'DELETE' ? 'red' : 'indigo'
                  }>{log.action}</Badge>
                </TD>
                <TD className="text-xs text-slate-600 uppercase tracking-wider font-bold">
                  {log.entity}
                </TD>
                <TD className="text-xs font-medium text-slate-700 max-w-lg">
                  {formatDetails(log)}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>

        {/* Pagination Section */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
            <p className="text-xs font-semibold text-slate-500">
              Menampilkan Halaman {currentPage} dari {totalPages}
            </p>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={currentPage === 1} 
                onClick={() => setCurrentPage(prev => prev - 1)}
                icon={ArrowLeft}
              >
                Sebelumnya
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={currentPage === totalPages} 
                onClick={() => setCurrentPage(prev => prev + 1)}
                icon={ArrowRight}
                iconPosition="right"
              >
                Berikutnya
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
