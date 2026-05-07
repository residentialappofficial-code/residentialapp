import { useState, useEffect, useCallback } from "react";
import { Plus, Megaphone, Trash2, Calendar, Tag, Search, X, Edit, FileText } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Modal, Button, Input, Card, Badge } from "@/components/ui";

export default function ManageAnnouncements() {
 const { selectedPerumahanId, profile } = useAuth();
 const [data, setData] = useState([]);
 const [loading, setLoading] = useState(true);
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [isEditMode, setIsEditMode] = useState(false);
 const [editingId, setEditingId] = useState(null);
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

 const handleEdit = (item) => {
  setEditingId(item.id);
  setFormData({
   judul: item.judul || "",
   konten: item.konten || "",
   kategori: item.kategori || "Umum"
  });
  setIsEditMode(true);
  setIsModalOpen(true);
 };

 useEffect(() => {
  fetchAnnouncements();
 }, [fetchAnnouncements]);

 const handleSubmit = async (e) => {
  if (e) e.preventDefault();
  setIsSubmitting(true);
  try {
   if (isEditMode) {
    const { error } = await supabase
     .from("pengumuman")
     .update(formData)
     .eq("id", editingId);
    if (error) throw error;
   } else {
    const { error } = await supabase
     .from("pengumuman")
     .insert([{ ...formData, perumahan_id: selectedPerumahanId }]);
    if (error) throw error;
   }
   
   setIsModalOpen(false);
   setIsEditMode(false);
   setEditingId(null);
   setFormData({ judul: "", konten: "", kategori: "Umum" });
   fetchAnnouncements();
  } catch (err) {
   alert("Gagal menyimpan pengumuman: " + err.message);
  } finally {
   setIsSubmitting(false);
  }
 };

 const handleDelete = async (id) => {
  if (!window.confirm("Hapus pengumuman ini secara permanen?")) return;
  try {
   const { error } = await supabase.from("pengumuman").delete().eq("id", id);
   if (error) throw error;
   fetchAnnouncements();
  } catch (err) {
   alert("Gagal menghapus: " + err.message);
  }
 };

 return (
  <div className="flex flex-col gap-8 max-w-full mx-auto">
   <div className="flex justify-between items-center">
    <div>
     <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pengumuman Komplek</h1>
     <p className="text-slate-500 text-sm font-medium">Informasi resmi dari pengurus perumahan.</p>
    </div>
    {isAdmin && (
     <Button
      onClick={() => {
       setIsEditMode(false);
       setEditingId(null);
       setFormData({ judul: "", konten: "", kategori: "Umum" });
       setIsModalOpen(true);
      }}
      variant="primary"
      icon={Plus}
     >
      Buat Pengumuman
     </Button>
    )}
   </div>

   <div className="grid grid-cols-1 gap-6">
    {loading ? (
     Array(3).fill(0).map((_, i) => (
      <div key={i} className="bg-white p-8 rounded-2xl border border-slate-100 animate-pulse h-40"></div>
     ))
    ) : data.length === 0 ? (
     <Card className="py-24 text-center flex flex-col items-center gap-6">
      <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200">
       <Megaphone className="w-10 h-10" />
      </div>
      <p className="text-slate-400 font-bold tracking-widest text-xs uppercase">Belum ada pengumuman saat ini.</p>
     </Card>
    ) : data.map((item) => (
     <Card key={item.id} className="group hover:border-slate-300 transition-all overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-slate-100 transition-colors"></div>
      <div className="relative z-10 space-y-6">
       <div className="flex justify-between items-start gap-4">
        <div className="flex items-center gap-3">
         <Badge variant={item.kategori === 'Urgent' ? 'red' : 'slate'} className="font-bold">
          {item.kategori}
         </Badge>
         <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-tight">
          <Calendar className="w-3.5 h-3.5" />
          {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
         </div>
        </div>
        {isAdmin && (
         <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
          <button 
           onClick={() => handleEdit(item)}
           className="p-2 text-slate-300 hover:text-slate-950 hover:bg-slate-50 rounded-xl transition-all"
          >
           <Edit className="w-4 h-4" />
          </button>
          <button 
           onClick={() => handleDelete(item.id)}
           className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
          >
           <Trash2 className="w-4 h-4" />
          </button>
         </div>
        )}
       </div>
       <div className="space-y-3">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight group-hover:text-black transition-colors">{item.judul}</h2>
        <p className="text-slate-600 text-base leading-relaxed whitespace-pre-wrap font-bold tracking-tight">{item.konten}</p>
       </div>
      </div>
     </Card>
    ))}
   </div>

   <Modal
    isOpen={isModalOpen}
    onClose={() => setIsModalOpen(false)}
    title={isEditMode ? "Edit Pengumuman" : "Buat Pengumuman Baru"}
   >
    <form onSubmit={handleSubmit} className="space-y-8">
     <Input
      label="Judul Pengumuman"
      required
      value={formData.judul}
      onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
      placeholder="Contoh: Info Fogging Hari Minggu"
     />
     
     <div className="space-y-3">
      <label className="text-xs font-bold text-slate-400 ml-1">Kategori</label>
      <div className="flex flex-wrap gap-2">
       {['Umum', 'Kegiatan', 'Iuran', 'Urgent'].map((cat) => (
        <button
         key={cat}
         type="button"
         onClick={() => setFormData({ ...formData, kategori: cat })}
         className={`px-5 py-2.5 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all border ${
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
      <label className="text-xs font-bold text-slate-400 ml-1">Isi Pengumuman</label>
      <textarea
       required
       rows={6}
       value={formData.konten}
       onChange={(e) => setFormData({ ...formData, konten: e.target.value })}
       className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-bold focus:border-slate-950 outline-none transition-all resize-none placeholder:text-slate-300"
       placeholder="Tuliskan detail pengumuman di sini..."
      />
     </div>

     <div className="flex gap-4 pt-4">
      <Button variant="ghost" className="flex-1" onClick={() => setIsModalOpen(false)}>Batal</Button>
      <Button 
       variant="primary" 
       className="flex-1" 
       type="submit"
       isLoading={isSubmitting}
      >
       {isEditMode ? "Update" : "Terbitkan"}
      </Button>
     </div>
    </form>
   </Modal>
  </div>
 );
}
