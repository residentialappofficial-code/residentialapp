import { useState, useEffect, useCallback } from "react";
import { Plus, Megaphone, Trash2, Calendar, Tag, Search, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export default function ManageAnnouncements() {
  const { selectedPerumahanId, profile } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ judul: "", konten: "", kategori: "Umum" });

  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';

  const fetchAnnouncements = useCallback(async () => {
    if (!selectedPerumahanId) return;
    try {
      setLoading(true);
      const { data: announcements, error } = await supabase
        .from("pengumuman")
        .select("*")
        .eq("perumahan_id", selectedPerumahanId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setData(announcements || []);
    } catch (err) {
      console.error("Error fetching announcements:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedPerumahanId]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("pengumuman")
        .insert([{ ...formData, perumahan_id: selectedPerumahanId }]);

      if (error) throw error;
      
      setIsModalOpen(false);
      setFormData({ judul: "", konten: "", kategori: "Umum" });
      fetchAnnouncements();
      alert("Pengumuman berhasil diterbitkan!");
    } catch (err) {
      alert("Gagal menerbitkan pengumuman: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Hapus pengumuman ini?")) return;
    try {
      const { error } = await supabase.from("pengumuman").delete().eq("id", id);
      if (error) throw error;
      fetchAnnouncements();
    } catch (err) {
      alert("Gagal menghapus: " + err.message);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pengumuman Komplek</h1>
          <p className="text-slate-500 text-sm">Informasi resmi dari pengurus perumahan.</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Buat Pengumuman
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 animate-pulse h-32"></div>
          ))
        ) : data.length === 0 ? (
          <div className="bg-white p-20 rounded-2xl border border-slate-200 text-center flex flex-col items-center gap-4">
            <Megaphone className="w-12 h-12 text-slate-200" />
            <p className="text-slate-400 font-medium">Belum ada pengumuman saat ini.</p>
          </div>
        ) : data.map((item) => (
          <div key={item.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                    item.kategori === 'Urgent' ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600'
                  }`}>
                    {item.kategori}
                  </span>
                  <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                </div>
                <h2 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{item.judul}</h2>
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{item.konten}</p>
              </div>
              {isAdmin && (
                <button 
                  onClick={() => handleDelete(item.id)}
                  className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal Buat Pengumuman */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <form onSubmit={handleSubmit}>
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="text-lg font-bold text-slate-900">Buat Pengumuman Baru</h3>
                <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-8 flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Judul Pengumuman</label>
                  <input
                    required
                    value={formData.judul}
                    onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition-all"
                    placeholder="Contoh: Info Fogging Hari Minggu"
                  />
                </div>
                
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kategori</label>
                  <div className="flex gap-2">
                    {['Umum', 'Kegiatan', 'Iuran', 'Urgent'].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setFormData({ ...formData, kategori: cat })}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
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
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Isi Pengumuman</label>
                  <textarea
                    required
                    rows={6}
                    value={formData.konten}
                    onChange={(e) => setFormData({ ...formData, konten: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition-all resize-none"
                    placeholder="Tuliskan detail pengumuman di sini..."
                  />
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
                  disabled={isSubmitting}
                  className="bg-indigo-600 text-white px-8 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? "Menerbitkan..." : "Terbitkan Sekarang"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
