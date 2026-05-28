import { useState, useEffect, useCallback } from "react";
import { MessageSquareWarning, Plus, Camera, Clock, CheckCircle2, AlertTriangle, X, Search, Filter, UserPlus, UserCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Modal, Button, Input, Card, Badge, Textarea } from "@/components/ui";

export default function Complaints() {
  const { selectedPerumahanId, profile } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({ kategori: "Keamanan", deskripsi: "", foto_url: "" });
  const [staffList, setStaffList] = useState([]);

  const isGlobalAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';

  const fetchComplaints = useCallback(async () => {
    if (!selectedPerumahanId || !profile?.id) return;
    try {
      setLoading(true);
      
      let query = supabase
        .from("keluhan")
        .select(`
          *,
          warga:profiles!warga_id(
            nama,
            warga_info:warga!user_id(blok)
          ),
          assigned:profiles!assigned_to(nama)
        `)
        .eq("perumahan_id", selectedPerumahanId)
        .order("created_at", { ascending: false });

      // Logic: Admin sees all, Staff sees assigned + own, Warga sees only own
      if (!isGlobalAdmin) {
        query = query.or(`warga_id.eq.${profile.id},assigned_to.eq.${profile.id}`);
      }

      const { data: complaints, error } = await query;
      if (error) throw error;
      setData(complaints || []);

      if (isGlobalAdmin) {
        const { data: staff, error: sError } = await supabase
          .from('pengurus')
          .select('*, warga:warga_id(nama, user_id)')
          .eq('perumahan_id', selectedPerumahanId)
          .not('warga_id', 'is', null);
        
        if (!sError) {
          const activeStaff = staff.filter(s => s.warga?.user_id).map(s => ({
            id: s.warga.user_id,
            nama: s.warga.nama,
            jabatan: s.jabatan
          }));
          setStaffList(activeStaff);
        }
      }
    } catch (err) {
      console.error("Error fetching complaints:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedPerumahanId, isGlobalAdmin, profile?.id]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `complaint-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('complaints')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('complaints')
        .getPublicUrl(fileName);

      setFormData({ ...formData, foto_url: publicUrl });
    } catch (err) {
      alert("Gagal upload foto: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("keluhan")
        .insert([{ 
          ...formData, 
          perumahan_id: selectedPerumahanId,
          warga_id: profile.id
        }]);

      if (error) throw error;
      
      setIsModalOpen(false);
      setFormData({ kategori: "Keamanan", deskripsi: "", foto_url: "" });
      fetchComplaints();
    } catch (err) {
      alert("Gagal mengirim keluhan: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const { error } = await supabase
        .from("keluhan")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;
      fetchComplaints();
    } catch (err) {
      alert("Gagal update status: " + err.message);
    }
  };

  const handleAssignStaff = async (id, staffId) => {
    try {
      const { error } = await supabase
        .from("keluhan")
        .update({ assigned_to: staffId })
        .eq("id", id);

      if (error) throw error;
      fetchComplaints();
    } catch (err) {
      alert("Gagal menugaskan pengurus: " + err.message);
    }
  };

  return (
    <div className="flex flex-col gap-4 md:gap-8 max-w-full mx-auto">
      <div className="flex justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Laporan & Keluhan</h1>
          <p className="text-slate-500 text-sm mt-1">Sampaikan keluhan atau kendala di lingkungan perumahan.</p>
        </div>
        {!isGlobalAdmin && (
          <Button
            onClick={() => setIsModalOpen(true)}
            variant="primary"
            size="md"
            icon={Plus}
            className="hidden md:flex"
          >
            Kirim Keluhan
          </Button>
        )}
      </div>

    <div className="grid grid-cols-1 gap-6">
        {loading ? (
          Array(2).fill(0).map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 animate-pulse h-48"></div>
          ))
        ) : data.length === 0 ? (
          <Card className="py-20 text-center flex flex-col items-center gap-6">
            <div className="w-16 h-16 bg-slate-50 rounded-xl flex items-center justify-center text-slate-200">
              <MessageSquareWarning className="w-8 h-8" />
            </div>
            <p className="text-slate-400 font-medium text-sm">Belum ada laporan keluhan.</p>
          </Card>
        ) : data.map((item) => {
          const isAssignedToMe = item.assigned_to === profile.id;
          const canManage = isGlobalAdmin || isAssignedToMe;

          return (
            <Card key={item.id} noPadding className="overflow-hidden group hover:shadow-md transition-all">
              <div className="flex flex-col md:flex-row">
                {item.foto_url && (
                  <div className="md:w-64 h-64 md:h-auto overflow-hidden bg-slate-50 shrink-0 border-r border-slate-100">
                    <img src={item.foto_url} alt="Lampiran" className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-700" />
                  </div>
                )}
                <div className="p-6 flex-1 flex flex-col gap-6">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <Badge variant="indigo" className="text-[10px] font-bold px-2 py-1 rounded-md">{item.kategori}</Badge>
                          <div className={`flex items-center gap-1.5 text-xs font-semibold ${
                            item.status === 'Resolved' ? 'text-green-600' : 
                            item.status === 'In Progress' ? 'text-amber-600' : 'text-slate-400'
                          }`}>
                            {item.status === 'Resolved' ? <CheckCircle2 className="w-3.5 h-3.5" /> : 
                             item.status === 'In Progress' ? <Clock className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                            {item.status === 'Resolved' ? 'Selesai' : 
                             item.status === 'In Progress' ? 'Diproses' : 'Laporan Baru'}
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-slate-900 tracking-tight">
                            Pelapor: {item.warga?.nama || "Admin"}
                          </p>
                          <p className="text-[11px] text-slate-500 font-medium">
                            Unit {item.warga?.warga_info?.[0]?.blok || item.warga?.blok || "-"} • {new Date(item.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 text-slate-400">
                          <UserCheck className="w-3.5 h-3.5" />
                          <span className="text-[11px] font-medium">
                            Petugas: <span className="text-slate-900 ml-1">{item.assigned?.nama || "Menunggu Penugasan"}</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-4 w-full md:w-auto">
                        {isGlobalAdmin && (
                          <Select
                            value={item.assigned_to || ""}
                            onChange={(e) => handleAssignStaff(item.id, e.target.value)}
                            className="text-xs bg-slate-50 border-slate-100 min-w-[200px]"
                          >
                            <option value="">Tugaskan Petugas</option>
                            {staffList.map(s => (
                              <option key={s.id} value={s.id}>{s.nama} ({s.jabatan})</option>
                            ))}
                          </Select>
                        )}

                        {canManage && item.status !== 'Resolved' && (
                          <div className="flex gap-2">
                            {item.status !== 'In Progress' && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex-1 bg-amber-50 border-amber-100 text-amber-600 hover:bg-amber-100"
                                onClick={() => handleUpdateStatus(item.id, 'In Progress')}
                              >
                                Proses
                              </Button>
                            )}
                            <Button 
                              variant="primary" 
                              size="sm" 
                              className="flex-1 bg-green-600 hover:bg-green-700 border-none"
                              onClick={() => handleUpdateStatus(item.id, 'Resolved')}
                            >
                              Selesai
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-50">
                      <p className="text-slate-700 text-sm font-medium leading-relaxed">{item.deskripsi}</p>
                    </div>
                  </div>
                </div>
            </Card>
          );
        })}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Kirim Keluhan Baru"
      >
        <form onSubmit={handleSubmit} className="space-y-10 p-2">
          <div className="space-y-4">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Kategori Keluhan</label>
            <div className="grid grid-cols-2 gap-3">
              {['Keamanan', 'Kebersihan', 'Infrastruktur', 'Lainnya'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFormData({ ...formData, kategori: cat })}
                  className={`px-4 py-3 rounded-xl text-xs font-bold transition-all border ${
                    formData.kategori === cat 
                      ? 'bg-slate-900 border-slate-900 text-white shadow-md shadow-slate-100'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <Textarea
            label="Deskripsi Masalah"
            required
            value={formData.deskripsi}
            onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
            placeholder="Jelaskan detail masalah Anda..."
            className="min-h-[150px]"
          />

          <div className="space-y-4">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Foto Lampiran (Opsional)</label>
            <div className="flex items-center gap-4">
              <label className="w-20 h-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-all group">
                <Camera className="w-6 h-6 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
              {uploading && (
                <div className="w-8 h-8 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
              )}
              {formData.foto_url && (
                <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                  <img src={formData.foto_url} alt="Preview" className="w-full h-full object-cover" />
                  <button 
                    type="button" 
                    onClick={() => setFormData({ ...formData, foto_url: "" })}
                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-md shadow-md hover:bg-red-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-4 pt-6">
            <Button variant="ghost" className="flex-1 py-2.5 font-semibold" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button 
              variant="primary" 
              className="flex-1 py-2.5 font-semibold"
              type="submit"
              isLoading={isSubmitting}
              disabled={uploading}
            >
              Kirim Laporan
            </Button>
          </div>
        </form>
      </Modal>

      {/* Mobile Floating Action Button (FAB) */}
      {!isGlobalAdmin && (
        <button 
          onClick={() => setIsModalOpen(true)}
          className="fixed bottom-6 right-6 md:hidden z-40 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center shadow-lg shadow-indigo-300 active:scale-95 transition-all cursor-pointer border-none"
          title="Kirim Keluhan"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}
