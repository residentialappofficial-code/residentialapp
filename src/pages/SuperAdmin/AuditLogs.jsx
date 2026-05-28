import { useState, useEffect } from "react";
import { Shield, Clock, FileText, Activity } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Card, CardHeader, Table, THead, TBody, TR, TH, TD, Badge, Button } from "@/components/ui";

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*, user:user_id(email)')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      console.error("Gagal memuat audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Shield className="w-6 h-6 text-indigo-600" /> Audit Trail
        </h1>
        <p className="text-slate-500 text-sm mt-1">Sistem pencatatan log aktivitas dan perubahan kritikal.</p>
      </div>

      <Card noPadding>
        <CardHeader 
          title="Riwayat Aktivitas (Terbaru)" 
          subtitle="Menampilkan 100 aktivitas terakhir dari seluruh admin"
          action={<Button variant="outline" size="sm" onClick={fetchLogs} icon={Activity}>Refresh Data</Button>}
        />
        <Table>
          <THead>
            <TR isHeader>
              <TH>Waktu</TH>
              <TH>Pengguna</TH>
              <TH>Aksi</TH>
              <TH>Entitas</TH>
              <TH>Detail</TH>
            </TR>
          </THead>
          <TBody>
            {loading ? (
              <TR><TD colSpan={5} className="text-center py-8 text-slate-400">Memuat log...</TD></TR>
            ) : logs.length === 0 ? (
              <TR><TD colSpan={5} className="text-center py-8 text-slate-400">Belum ada log terekam.</TD></TR>
            ) : logs.map((log) => (
              <TR key={log.id}>
                <TD className="text-xs text-slate-500 whitespace-nowrap">
                  {new Date(log.created_at).toLocaleString('id-ID')}
                </TD>
                <TD className="text-sm font-medium text-slate-800">
                  {log.user?.email || 'System / Webhook'}
                </TD>
                <TD>
                  <Badge variant={
                    log.action === 'CREATE' ? 'green' : 
                    log.action === 'UPDATE' ? 'orange' : 
                    log.action === 'DELETE' ? 'red' : 'indigo'
                  }>{log.action}</Badge>
                </TD>
                <TD className="text-sm text-slate-600 uppercase tracking-widest text-[10px] font-bold">
                  {log.entity}
                </TD>
                <TD className="text-xs text-slate-500 max-w-xs truncate">
                  {log.details ? JSON.stringify(log.details) : '-'}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>
    </div>
  );
}
