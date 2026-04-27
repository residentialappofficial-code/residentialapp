import { useState, useEffect, useCallback } from "react";
import { MessageSquareWarning, Plus, Camera, Clock, CheckCircle2, AlertTriangle, X, Search, Filter } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export default function Complaints() {
  const { selectedPerumahanId, profile } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({ kategori: "Keamanan", deskripsi: "", foto_url: "" });

  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';

  const fetchComplaints = useCallback(async () => {
    if (!selectedPerumahanId) return;
    try {
      setLoading(true);
      let query = supabase
        .from("keluhan")
        .select(`
          *,
          warga:warga_id(nama, blok)
        `)
        .eq("perumahan_id", selectedPerumahanId)
        .order("created_at", { ascending: false });

      // Jika warga biasa, hanya lihat keluhan miliknya
      if (!isAdmin) {
        query = query.eq("warga_id", profile.id);
      }

      const { data: complaints, error } = await query;
      if (error) throw error;
      setData(complaints || []);
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
    e.preventDefault();
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
      alert("Keluhan berhasil dikirim!");
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

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Laporan & Keluhan</h1>
          <p className="text-slate-500 text-sm">Sampaikan keluhan atau kendala di lingkungan perumahan.</p>
        </div>
        {!isAdmin && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Kirim Keluhan
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          Array(2).fill(0).map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 animate-pulse h-40"></div>
          ))
        ) : data.length === 0 ? (
          <div className="bg-white p-20 rounded-2xl border border-slate-200 text-center flex flex-col items-center gap-4">
            <MessageSquareWarning className="w-12 h-12 text-slate-200" />
            <p className="text-slate-400 font-medium">Belum ada laporan keluhan.</p>
          </div>
        ) : data.map((item) => (
          <div key={item.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
            {item.foto_url && (
              <div className="md:w-48 h-48 md:h-auto overflow-hidden bg-slate-100 shrink-0 border-r border-slate-100">
                <img src={item.foto_url} alt="Lampiran" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="p-6 flex-1 flex flex-col gap-4">
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                      {item.kategori}
                    </span>
                    <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest ${
                      item.status === 'Resolved' ? 'text-green-600' : 
                      item.status === 'In Progress' ? 'text-amber-600' : 'text-slate-400'
                    }`}>
                      {item.status === 'Resolved' ? <CheckCircle2 className="w-3.5 h-3.5" /> : 
                       item.status === 'In Progress' ? <Clock className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                      {item.status === 'Resolved' ? 'Selesai' : 
                       item.status === 'In Progress' ? 'Diproses' : 'Baru'}
                    </div>
                  </div>
                  {isAdmin && (
                    <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest pt-1">
                      Pelapor: {item.warga?.nama} ({item.warga?.blok})
                    </p>
                  )}
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest pt-1">
                    {new Date(item.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {isAdmin && item.status !== 'Resolved' && (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleUpdateStatus(item.id, 'In Progress')}
                      className="px-3 py-1.5 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-amber-100 transition-all"
                    >
                      Proses
                    </button>
                    <button 
                      onClick={() => handleUpdateStatus(item.id, 'Resolved')}
                      className="px-3 py-1.5 bg-green-50 text-green-600 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-green-100 transition-all"
                    >
                      Selesai
                    </button>
                  </div>
                )}
              </div>
              <p className="text-slate-700 text-sm leading-relaxed">{item.deskripsi}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Kirim Keluhan */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <form onSubmit={handleSubmit}>
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="text-lg font-bold text-slate-900">Kirim Keluhan Baru</h3>
                <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-8 flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kategori Keluhan</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {['Keamanan', 'Kebersihan', 'Infrastruktur', 'Lainnya'].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setFormData({ ...formData, kategori: cat })}
                        className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase transition-all ${
                          formData.kategori === cat 
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' 
                            : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Deskripsi Keluhan</label>
                  <textarea
                    required
                    rows={4}
                    value={formData.deskripsi}
                    onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition-all resize-none"
                    placeholder="Jelaskan detail masalah Anda..."
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Foto Lampiran (Opsional)</label>
                  <div className="flex items-center gap-4">
                    <label className="w-24 h-24 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-50 hover:border-indigo-200 transition-all group">
                      <Camera className="w-6 h-6 text-slate-300 group-hover:text-indigo-600" />
                      <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                    </label>
                    {uploading && (
                      <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    )}
                    {formData.foto_url && (
                      <div className="relative w-24 h-24 rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                        <img src={formData.foto_url} alt="Preview" className="w-full h-full object-cover" />
                        <button 
                          type="button" 
                          onClick={() => setFormData({ ...formData, foto_url: "" })}
                          className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full shadow-lg"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2 text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || uploading}
                  className="bg-indigo-600 text-white px-8 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? "Mengirim..." : "Kirim Laporan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
