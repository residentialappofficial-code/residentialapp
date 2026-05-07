import { useState, useEffect, useCallback } from "react";
import { MessageSquareWarning, Plus, Camera, Clock, CheckCircle2, AlertTriangle, X, Search, Filter, UserPlus, UserCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Modal, Button, Input, Card, Badge } from "@/components/ui";

export default function Complaints() {
  const { selectedPerumahanId, profile } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({ kategori: "Keamanan", deskripsi: "", foto_url: "" });
  const [staffList, setStaffList] = useState([]);

  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';

  const fetchComplaints = useCallback(async () => {
    if (!selectedPerumahanId) return;
    try {
      setLoading(true);
      
      // Fetch complaints
      let query = supabase
        .from("keluhan")
        .select(`
          *,
          warga:warga_id(nama, blok),
          assigned:assigned_to(nama)
        `)
        .eq("perumahan_id", selectedPerumahanId)
        .order("created_at", { ascending: false });

      if (!isAdmin) {
        // Residents only see their own complaints, BUT they also need to see complaints ASSIGNED to them
        // Actually, if a staff is a resident, they should see complaints assigned to them in the same list.
        query = query.or(`warga_id.eq.${profile.id},assigned_to.eq.${profile.id}`);
      }

      const { data: complaints, error } = await query;
      if (error) throw error;
      setData(complaints || []);

      // Fetch active staff (pengurus linked to warga with user_id)
      if (isAdmin) {
        const { data: staff, error: sError } = await supabase
          .from('pengurus')
          .select('*, warga:warga_id(nama, user_id)')
          .eq('perumahan_id', selectedPerumahanId)
          .not('warga_id', 'is', null);
        
        if (!sError) {
          // Filter staff who can actually log in (have user_id)
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
  }, [selectedPerumahanId, isAdmin, profile?.id]);

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
    <div className="flex flex-col gap-8 max-w-full mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Laporan & Keluhan</h1>
          <p className="text-slate-500 text-sm font-medium">Sampaikan keluhan atau kendala di lingkungan perumahan.</p>
        </div>
        {!isAdmin && (
          <Button
            onClick={() => setIsModalOpen(true)}
            variant="primary"
            icon={Plus}
          >
            Kirim Keluhan
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          Array(2).fill(0).map((_, i) => (
            <div key={i} className="bg-white p-8 rounded-2xl border border-slate-100 animate-pulse h-48"></div>
          ))
        ) : data.length === 0 ? (
          <Card className="py-24 text-center flex flex-col items-center gap-6">
            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200">
              <MessageSquareWarning className="w-10 h-10" />
            </div>
            <p className="text-slate-400 font-bold tracking-widest text-xs uppercase">Belum ada laporan keluhan.</p>
          </Card>
        ) : data.map((item) => {
          const isAssignedToMe = item.assigned_to === profile.id;
          const canManage = isAdmin || isAssignedToMe;

          return (
            <Card key={item.id} noPadding className="overflow-hidden group hover:border-slate-300 transition-all">
              <div className="flex flex-col md:flex-row">
                {item.foto_url && (
                  <div className="md:w-64 h-64 md:h-auto overflow-hidden bg-slate-50 shrink-0 border-r border-slate-50">
                    <img src={item.foto_url} alt="Lampiran" className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-700" />
                  </div>
                )}
                <div className="p-8 flex-1 flex flex-col gap-6">
                  <div className="flex flex-wrap justify-between items-start gap-4">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <Badge variant="slate" className="font-bold">{item.kategori}</Badge>
                        <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest ${
                          item.status === 'Resolved' ? 'text-green-600' : 
                          item.status === 'In Progress' ? 'text-amber-600' : 'text-slate-400'
                        }`}>
                          {item.status === 'Resolved' ? <CheckCircle2 className="w-4 h-4" /> : 
                           item.status === 'In Progress' ? <Clock className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                          {item.status === 'Resolved' ? 'Selesai' : 
                           item.status === 'In Progress' ? 'Diproses' : 'Baru'}
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-900 tracking-tight">
                          Pelapor: {item.warga?.nama || "Admin"} ({item.warga?.blok || "-"})
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold tracking-tight">
                          {new Date(item.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>

                      {/* Assignment Info */}
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                          Petugas: {item.assigned?.nama || "Belum ditugaskan"}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 items-end">
                      {/* Assignment Dropdown for Admins */}
                      {isAdmin && (
                        <select 
                          value={item.assigned_to || ""}
                          onChange={(e) => handleAssignStaff(item.id, e.target.value)}
                          className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg outline-none focus:border-slate-950 transition-all"
                        >
                          <option value="">Tugaskan Petugas</option>
                          {staffList.map(s => (
                            <option key={s.id} value={s.id}>{s.nama} ({s.jabatan})</option>
                          ))}
                        </select>
                      )}

                      {/* Action Buttons for Admin or Assigned Staff */}
                      {canManage && item.status !== 'Resolved' && (
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="bg-amber-50 text-amber-600 hover:bg-amber-100"
                            onClick={() => handleUpdateStatus(item.id, 'In Progress')}
                          >
                            Proses
                          </Button>
                          <Button 
                            variant="primary" 
                            size="sm" 
                            className="bg-green-600 border-green-700 hover:bg-green-700"
                            onClick={() => handleUpdateStatus(item.id, 'Resolved')}
                          >
                            Selesai
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-slate-700 text-base font-bold leading-relaxed tracking-tight">{item.deskripsi}</p>
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
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-400 ml-1">Kategori Keluhan</label>
            <div className="grid grid-cols-2 gap-2">
              {['Keamanan', 'Kebersihan', 'Infrastruktur', 'Lainnya'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFormData({ ...formData, kategori: cat })}
                  className={`px-4 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all border ${
                    formData.kategori === cat 
                      ? 'bg-slate-950 border-slate-950 text-white'
                      : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 ml-1">Deskripsi Masalah</label>
            <textarea
              required
              rows={4}
              value={formData.deskripsi}
              onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
              className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-bold focus:border-slate-950 outline-none transition-all resize-none placeholder:text-slate-300"
              placeholder="Jelaskan detail masalah Anda..."
            />
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-400 ml-1">Foto Lampiran (Opsional)</label>
            <div className="flex items-center gap-4">
              <label className="w-24 h-24 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-all group">
                <Camera className="w-6 h-6 text-slate-300 group-hover:text-slate-950 transition-colors" />
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
              {uploading && (
                <div className="w-6 h-6 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
              )}
              {formData.foto_url && (
                <div className="relative w-24 h-24 rounded-2xl overflow-hidden border border-slate-200 shadow-sm group">
                  <img src={formData.foto_url} alt="Preview" className="w-full h-full object-cover" />
                  <button 
                    type="button" 
                    onClick={() => setFormData({ ...formData, foto_url: "" })}
                    className="absolute top-1 right-1 bg-red-500 text-white p-1.5 rounded-full shadow-lg hover:bg-red-600 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button variant="ghost" className="flex-1" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button 
              variant="primary" 
              className="flex-1"
              type="submit"
              isLoading={isSubmitting}
              disabled={uploading}
            >
              Kirim Laporan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
