import React, { useState, useEffect } from "react";
import { 
  Building2, 
  Search, 
  Calendar, 
  UserCog, 
  ShieldCheck, 
  Edit, 
  AlertCircle,
  TrendingUp,
  CheckCircle,
  XCircle,
  CalendarDays
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { 
  Button, 
  Card, 
  CardHeader, 
  Badge, 
  Input, 
  Select, 
  Modal 
} from "@/components/ui";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/Table";

export default function ManageSubscriptions() {
  const [complexes, setComplexes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedComplex, setSelectedComplex] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Edit form state
  const [editStatus, setEditStatus] = useState("active");
  const [editPlan, setEditPlan] = useState("trial");
  const [editValidUntil, setEditValidUntil] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchComplexes();
  }, []);

  const fetchComplexes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("perumahan")
        .select("*")
        .order("nama");
      if (error) throw error;
      setComplexes(data || []);
    } catch (err) {
      alert("Gagal memuat data perumahan: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (complex) => {
    setSelectedComplex(complex);
    setEditStatus(complex.subscription_status || "active");
    setEditPlan(complex.subscription_plan || "trial");
    
    // Format date to YYYY-MM-DD for input
    if (complex.subscription_valid_until) {
      const date = new Date(complex.subscription_valid_until);
      const formatted = date.toISOString().split("T")[0];
      setEditValidUntil(formatted);
    } else {
      setEditValidUntil("");
    }
    
    setIsModalOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedComplex) return;
    setSaving(true);
    try {
      // Set valid until time to end of day in local time
      const isoDateTime = editValidUntil 
        ? new Date(`${editValidUntil}T23:59:59`).toISOString() 
        : null;

      // Map subscription status to perumahan status logic
      const perumahanStatus = (editStatus === "suspended" || editStatus === "expired") 
        ? "suspended" 
        : "active";

      const { error } = await supabase
        .from("perumahan")
        .update({
          subscription_status: editStatus,
          subscription_plan: editPlan,
          subscription_valid_until: isoDateTime,
          status: perumahanStatus
        })
        .eq("id", selectedComplex.id);

      if (error) throw error;

      alert("Data langganan berhasil diperbarui!");
      setIsModalOpen(false);
      fetchComplexes();
    } catch (err) {
      alert("Gagal memperbarui data: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Stats calculation
  const totalComplexes = complexes.length;
  
  const activeComplexes = complexes.filter(c => {
    if (c.status === 'suspended' || c.subscription_status === 'expired' || c.subscription_status === 'suspended') return false;
    if (c.subscription_valid_until) {
      return new Date(c.subscription_valid_until) >= new Date();
    }
    return true;
  }).length;

  const expiredComplexes = totalComplexes - activeComplexes;

  // Monthly Revenue Estimate (approximate based on active paying complexes)
  const monthlyRevenueEstimate = complexes.reduce((sum, c) => {
    const isActive = !c.status || c.status === 'active';
    const isPaying = c.subscription_plan && c.subscription_plan !== 'trial';
    if (isActive && isPaying) {
      return sum + (c.subscription_plan === 'yearly' ? 125000 : 150000);
    }
    return sum;
  }, 0);

  // Filter complexes by search term
  const filteredComplexes = complexes.filter(c => 
    c.nama?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.alamat?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatValidUntil = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('id-ID', options);
  };

  const isLicenseActive = (complex) => {
    if (complex.subscription_status === 'expired' || complex.subscription_status === 'suspended' || complex.status === 'suspended') {
      return false;
    }
    if (complex.subscription_valid_until) {
      return new Date(complex.subscription_valid_until) >= new Date();
    }
    return true;
  };

  return (
    <div className="max-w-full mx-auto flex flex-col gap-6 md:gap-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Kelola Langganan Perumahan</h1>
        <p className="text-slate-500 text-sm mt-1">Pantau, perbarui, dan manipulasi data lisensi SaaS perumahan pelanggan.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="border-l-4 border-l-slate-950 bg-white p-5 rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Perumahan</span>
            <Building2 className="w-4 h-4" />
          </div>
          <span className="text-2xl font-bold text-slate-900">{totalComplexes}</span>
        </div>

        <div className="border-l-4 border-l-emerald-500 bg-white p-5 rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center text-emerald-600 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Lisensi Aktif</span>
            <CheckCircle className="w-4 h-4" />
          </div>
          <span className="text-2xl font-bold text-slate-900">{activeComplexes}</span>
        </div>

        <div className="border-l-4 border-l-red-500 bg-white p-5 rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center text-red-600 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Expired / Suspended</span>
            <XCircle className="w-4 h-4" />
          </div>
          <span className="text-2xl font-bold text-slate-900">{expiredComplexes}</span>
        </div>

        <div className="border-l-4 border-l-indigo-600 bg-white p-5 rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center text-indigo-600 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Estimasi MRR</span>
            <TrendingUp className="w-4 h-4" />
          </div>
          <span className="text-2xl font-bold text-slate-900">Rp {monthlyRevenueEstimate.toLocaleString()}</span>
        </div>
      </div>

      {/* Main Panel */}
      <Card noPadding>
        <CardHeader 
          title="Daftar Lisensi Perumahan"
          subtitle="Daftar lengkap perumahan (tenant) terdaftar beserta status berlangganan"
          action={
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari perumahan..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-900 transition-colors"
              />
            </div>
          }
        />

        <div className="p-0">
          <Table>
            <THead>
              <TR isHeader>
                <TH>Perumahan</TH>
                <TH>Paket</TH>
                <TH>Berlaku Hingga</TH>
                <TH>Sisa Hari</TH>
                <TH>Status Lisensi</TH>
                <TH textAlign="right">Aksi</TH>
              </TR>
            </THead>
            <TBody>
              {loading ? (
                <TR>
                  <TD colSpan={6} className="text-center py-20">
                    <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Memuat database...</span>
                  </TD>
                </TR>
              ) : filteredComplexes.length === 0 ? (
                <TR>
                  <TD colSpan={6} className="text-center py-20 text-slate-400">
                    Tidak ada data perumahan yang cocok.
                  </TD>
                </TR>
              ) : (
                filteredComplexes.map((complex) => {
                  const active = isLicenseActive(complex);
                  
                  let daysLeft = 0;
                  if (complex.subscription_valid_until) {
                    const diff = new Date(complex.subscription_valid_until) - new Date();
                    daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
                  }

                  return (
                    <TR key={complex.id}>
                      <TD>
                        <div className="flex flex-col">
                          <span>{complex.nama}</span>
                          <span className="text-xs text-slate-400 font-medium mt-0.5">{complex.alamat || "-"}</span>
                        </div>
                      </TD>
                      <TD>
                        <span className="uppercase text-xs font-extrabold tracking-wide text-indigo-600">
                          {complex.subscription_plan || "trial"}
                        </span>
                      </TD>
                      <TD>
                        <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                          <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                          {formatValidUntil(complex.subscription_valid_until)}
                        </span>
                      </TD>
                      <TD>
                        <span className={`font-bold ${daysLeft <= 0 ? 'text-red-500' : daysLeft <= 7 ? 'text-orange-500' : 'text-slate-700'}`}>
                          {daysLeft <= 0 ? "Expired" : `${daysLeft} Hari`}
                        </span>
                      </TD>
                      <TD>
                        <Badge variant={active ? "green" : "red"}>
                          {active ? "Aktif" : complex.subscription_status === 'suspended' ? "Suspended" : "Expired"}
                        </Badge>
                      </TD>
                      <TD textAlign="right">
                        <Button
                          onClick={() => openEditModal(complex)}
                          variant="outline"
                          size="sm"
                          icon={Edit}
                        >
                          Sunting
                        </Button>
                      </TD>
                    </TR>
                  );
                })
              )}
            </TBody>
          </Table>
        </div>
      </Card>

      {/* Edit License Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Sunting Lisensi: ${selectedComplex?.nama}`}
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button variant="dark" size="sm" isLoading={saving} onClick={handleUpdate}>
              Simpan Perubahan
            </Button>
          </>
        }
      >
        <div className="space-y-6 py-2">
          {/* Status Select */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status Langganan</label>
            <select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:border-slate-900 transition-colors"
            >
              <option value="trial">Trial</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="suspended">Suspended</option>
            </select>
            <p className="text-[10px] text-slate-400 font-medium">Status 'suspended' atau 'expired' akan secara otomatis menghentikan akses fungsional bagi admin & warga perumahan ini.</p>
          </div>

          {/* Plan Select */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Jenis Paket</label>
            <select
              value={editPlan}
              onChange={(e) => setEditPlan(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:border-slate-900 transition-colors"
            >
              <option value="trial">Trial</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          {/* Valid Until Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Masa Berlaku Lisensi</label>
            <div className="relative">
              <input
                type="date"
                value={editValidUntil}
                onChange={(e) => setEditValidUntil(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:border-slate-900 transition-colors"
              />
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Batas akhir akses operasional gratis/berbayar platform Habitix.</p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
