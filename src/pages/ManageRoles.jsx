import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { 
  Button, Input, Card, CardHeader, Table, THead, TBody, TR, TH, TD, 
  Badge, Modal 
} from "@/components/ui";
import { Shield, Plus, Edit, Trash2, Save, X, CheckSquare, Square } from "lucide-react";

const MODULES = [
  { id: 'dashboard', label: 'Ringkasan Sistem (Dashboard)' },
  { id: 'warga', label: 'Data Warga' },
  { id: 'blok', label: 'Manajemen Blok' },
  { id: 'pengurus', label: 'Struktur Pengurus' },
  { id: 'iuran', label: 'Iuran & Tagihan' },
  { id: 'kas', label: 'Catatan Kas' },
  { id: 'penggajian', label: 'Sistem Penggajian' },
  { id: 'assets', label: 'Manajemen Aset' },
  { id: 'pengumuman', label: 'Pengumuman Resmi' },
  { id: 'keluhan', label: 'Pusat Keluhan' },
  { id: 'forum', label: 'Forum Warga' },
  { id: 'profile_complex', label: 'Profil Komplek' }
];

const ACTIONS = [
  { id: 'view', label: 'Lihat' },
  { id: 'create', label: 'Tambah' },
  { id: 'edit', label: 'Edit' },
  { id: 'delete', label: 'Hapus' }
];

export default function ManageRoles() {
  const { selectedPerumahanId } = useAuth();
  const { isOwner } = usePermissions();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    name: "",
    permissions: {}
  });

  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('perumahan_roles')
        .select('*')
        .eq('perumahan_id', selectedPerumahanId)
        .order('name');
      
      if (error) throw error;
      setRoles(data || []);
    } catch (err) {
      alert("Gagal memuat peran: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedPerumahanId]);

  useEffect(() => {
    if (selectedPerumahanId) fetchRoles();
  }, [selectedPerumahanId, fetchRoles]);

  const togglePermission = (moduleId, actionId) => {
    const current = formData.permissions[moduleId] || [];
    let next;
    if (current.includes(actionId)) {
      next = current.filter(a => a !== actionId);
    } else {
      next = [...current, actionId];
    }
    
    setFormData({
      ...formData,
      permissions: {
        ...formData.permissions,
        [moduleId]: next
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const payload = {
        perumahan_id: selectedPerumahanId,
        name: formData.name,
        permissions: formData.permissions
      };

      if (editingId) {
        const { error } = await supabase
          .from('perumahan_roles')
          .update(payload)
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('perumahan_roles')
          .insert([payload]);
        if (error) throw error;
      }

      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ name: "", permissions: {} });
      fetchRoles();
    } catch (err) {
      alert("Gagal menyimpan: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (role) => {
    setEditingId(role.id);
    setFormData({
      name: role.name,
      permissions: role.permissions || {},
      isSystem: role.is_system
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id, isSystem) => {
    if (isSystem) return alert("Peran sistem tidak dapat dihapus.");
    if (!window.confirm("Hapus peran ini?")) return;
    
    try {
      const { error } = await supabase
        .from('perumahan_roles')
        .delete()
        .eq('id', id);
      if (error) throw error;
      fetchRoles();
    } catch (err) {
      alert("Gagal menghapus: " + err.message);
    }
  };

  if (!isOwner) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400">
        <Shield className="w-16 h-16 mb-4 opacity-20" />
        <p className="text-sm font-bold uppercase tracking-widest">Akses Dibatasi</p>
        <p className="text-xs mt-2">Hanya Admin Utama yang dapat mengelola peran.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Manajemen Hak Akses</h1>
          <p className="text-slate-500 text-sm mt-1">Buat peran pengurus dan tentukan izin akses per modul.</p>
        </div>
        <Button variant="primary" icon={Plus} onClick={() => {
          setEditingId(null);
          setFormData({ name: "", permissions: {} });
          setIsModalOpen(true);
        }}>Tambah Peran</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map((role) => (
          <Card key={role.id} className="relative group">
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${role.is_system ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{role.name}</h3>
                    {role.is_system && <Badge variant="blue" className="mt-1">Sistem</Badge>}
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="sm" icon={Edit} onClick={() => handleEdit(role)} />
                  {!role.is_system && (
                    <Button variant="ghost" size="sm" icon={Trash2} className="text-red-500" onClick={() => handleDelete(role.id, role.is_system)} />
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-50">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Ringkasan Izin</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(role.permissions).map(([mod, perms]) => (
                    perms.length > 0 && (
                      <div key={mod} className="px-2 py-1 bg-slate-50 rounded-md border border-slate-100 flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-600 uppercase">{mod}</span>
                        <div className="flex gap-1">
                          {perms.map(p => (
                            <div key={p} className="w-1.5 h-1.5 rounded-full bg-indigo-500" title={p}></div>
                          ))}
                        </div>
                      </div>
                    )
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Role Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={editingId ? "Edit Peran" : "Buat Peran Baru"}
        size="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-8">
          <Input 
            label="Nama Peran"
            required
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            placeholder="Contoh: Bendahara, Sekretaris RT"
            icon={Shield}
            disabled={formData.isSystem}
          />

          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Matriks Izin Akses</p>
              <div className="flex gap-4">
                {ACTIONS.map(action => (
                  <span key={action.id} className="text-[10px] font-bold text-slate-400 uppercase w-12 text-center">{action.label}</span>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              {MODULES.map(module => (
                <div key={module.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 group hover:bg-white hover:border-indigo-200 transition-all">
                  <span className="text-sm font-semibold text-slate-700">{module.label}</span>
                  <div className="flex gap-4">
                    {ACTIONS.map(action => {
                      const isChecked = (formData.permissions[module.id] || []).includes(action.id);
                      return (
                        <div 
                          key={action.id}
                          onClick={() => togglePermission(module.id, action.id)}
                          className={`w-12 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-all ${isChecked ? 'bg-slate-900 text-white shadow-md shadow-slate-100' : 'bg-white text-slate-300 border border-slate-200 hover:border-slate-900/20'}`}
                        >
                          {isChecked ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" variant="primary" className="flex-1" isLoading={isSubmitting} icon={Save}>
              Simpan Peran
            </Button>
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} icon={X}>
              Batal
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
