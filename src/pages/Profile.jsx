import { useState, useEffect } from "react";
import { User, Mail, Phone, MapPin, Camera, Shield, LogOut, Key, CheckCircle2, Building2, UserCircle, Activity, ArrowRight, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button, Input, Card, CardHeader, Modal, Select, PasswordInput, Textarea } from "@/components/ui";

export default function Profile() {
  const { profile, signOut, role } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nama: profile?.nama || "",
    email: profile?.email || "",
    telepon: profile?.telepon || "",
    alamat: profile?.alamat || "",
    avatar_url: profile?.avatar_url || "",
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const [isResident, setIsResident] = useState(false);
  const [residentInfo, setResidentInfo] = useState(null);
  const [showRegisterResident, setShowRegisterResident] = useState(false);
  const [regData, setRegData] = useState({ blok: "", status_hunian: "Pemilik" });

  useEffect(() => {
    if (profile) {
      setFormData({
        nama: profile.nama || "",
        email: profile.email || "",
        telepon: profile.telepon || "",
        alamat: profile.alamat || "",
        avatar_url: profile.avatar_url || "",
      });
    }
  }, [profile]);

  useEffect(() => {
    async function checkResident() {
      if (!profile?.id) return;
      const { data } = await supabase
        .from('warga')
        .select('*')
        .eq('user_id', profile.id)
        .maybeSingle();
      
      if (data) {
        setIsResident(true);
        setResidentInfo(data);
      }
    }
    checkResident();
  }, [profile]);

  const handleRegisterResident = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.from('warga').insert([{
        user_id: profile.id,
        nama: profile.nama,
        email: profile.email,
        perumahan_id: profile.perumahan_id,
        blok: regData.blok,
        status_hunian: regData.status_hunian
      }]);

      if (error) throw error;
      setShowRegisterResident(false);
      window.location.reload();
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update(formData)
        .eq('id', profile.id);
      
      if (error) throw error;
      alert("Profile updated successfully");
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    if (e) e.preventDefault();
    if (newPassword !== confirmPassword) return alert("Password tidak cocok");
    if (newPassword.length < 6) return alert("Password minimal 6 karakter");

    setIsUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      alert("Password berhasil diubah!");
      setIsModalOpen(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      alert("Gagal mengubah password: " + error.message);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    try {
      const formDataR2 = new FormData();
      formDataR2.append('file', file);
      formDataR2.append('fileName', `avatars/${profile.id}-${Date.now()}.${file.name.split('.').pop()}`);

      const res = await fetch('/api/upload', { method: 'POST', body: formDataR2 });
      const result = await res.json();

      if (!res.ok) throw new Error(result.error);

      const { error: dbError } = await supabase
        .from('profiles')
        .update({ avatar_url: result.url })
        .eq('id', profile.id);

      if (dbError) throw dbError;

      setFormData(prev => ({ ...prev, avatar_url: result.url }));
      alert("Avatar diperbarui!");
    } catch (err) {
      alert("Upload gagal: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-full mx-auto flex flex-col gap-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Profil Saya</h1>
          <p className="text-slate-500 text-sm mt-1">Kelola identitas personal dan keamanan akun HABITIX Anda.</p>
        </div>
        <div className="flex gap-4">
          <Button variant="ghost" icon={LogOut} size="lg" className="text-red-500 font-bold hover:bg-red-50 rounded-2xl" onClick={signOut}>Keluar</Button>
          <Button variant="primary" size="lg" icon={Key} className="font-bold rounded-2xl px-8 shadow-indigo-200 shadow-lg" onClick={() => setIsModalOpen(true)}>Ubah Password</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: Profile Overview */}
        <div className="lg:col-span-4 flex flex-col gap-10">
          <Card noPadding className="text-center overflow-hidden group border-none shadow-sm shadow-slate-100">
            <div className="h-32 bg-indigo-50/50 transition-all group-hover:h-36 duration-700 relative overflow-hidden">
               <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500 via-transparent to-transparent"></div>
            </div>
            <div className="relative flex flex-col items-center p-8 -mt-16">
              <div className="relative mb-6">
                <div className="w-32 h-32 bg-white p-2 rounded-2xl relative z-10 transition-transform group-hover:scale-105 duration-700 shadow-2xl shadow-slate-950/10 overflow-hidden">
                  {formData.avatar_url ? (
                    <img src={formData.avatar_url} alt="Avatar" className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                    <div className="w-full h-full bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 text-3xl font-bold uppercase">
                      {formData.nama?.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 z-20">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleAvatarUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30"
                  />
                  <button className="bg-indigo-600 p-3 rounded-2xl border-4 border-white text-white hover:scale-110 transition-all hover:bg-indigo-700 shadow-xl">
                    <Camera className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight leading-none mb-3">{formData.nama}</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">{role?.replace('_', ' ')}</p>
              
              <div className="flex items-center gap-2 px-6 py-2.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                Account Verified
              </div>
            </div>
          </Card>

          <Card noPadding className="!rounded-2xl border-none shadow-xl shadow-slate-200 overflow-hidden">
            <CardHeader title="Konteks Residensial" subtitle="Status terdaftar di database komplek" />
            <div className="p-8 flex flex-col gap-6">
              <div className={`flex items-center justify-between p-4 rounded-xl border transition-all ${isResident ? 'bg-indigo-50/50 border-indigo-100' : 'bg-slate-50 border-slate-100'}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-transform ${isResident ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-300 text-white'}`}>
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className={`text-[11px] font-semibold ${isResident ? 'text-indigo-600' : 'text-slate-400'}`}>
                      {isResident ? 'Resident Member' : 'Status Pending'}
                    </span>
                    <span className="text-sm font-bold text-slate-900 tracking-tight">
                      {isResident ? 'Warga Aktif' : 'Tamu / Umum'}
                    </span>
                  </div>
                </div>
                {isResident && <CheckCircle2 className="w-6 h-6 text-indigo-600" />}
              </div>

              {isResident ? (
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex justify-between items-center p-4 bg-slate-50/50 rounded-xl border border-slate-100 group/item hover:bg-white hover:border-indigo-200 transition-all">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[11px] font-semibold text-slate-400">Unit Rumah</span>
                      <span className="text-sm font-bold text-slate-900">{residentInfo?.blok || '-'}</span>
                    </div>
                    <ArrowRight size={14} className="text-slate-300 group-hover/item:text-indigo-400 group-hover/item:translate-x-1 transition-all" />
                  </div>
                  <div className="flex justify-between items-center p-4 bg-slate-50/50 rounded-xl border border-slate-100 group/item hover:bg-white hover:border-indigo-200 transition-all">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[11px] font-semibold text-slate-400">Status Hunian</span>
                      <span className="text-sm font-bold text-slate-900">{residentInfo?.status_hunian || '-'}</span>
                    </div>
                    <ArrowRight size={14} className="text-slate-300 group-hover/item:text-indigo-400 group-hover/item:translate-x-1 transition-all" />
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-8 pt-2">
                  <p className="text-xs text-slate-400 font-bold leading-relaxed px-6">
                    Selesaikan pendaftaran warga Anda untuk mengakses semua fitur eksklusif komunitas HABITIX.
                  </p>
                  <Button 
                    variant="primary" 
                    className="w-full"
                    onClick={() => setShowRegisterResident(true)}
                  >
                    Lengkapi Data Warga
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right: Personal Information */}
        <div className="lg:col-span-8">
          <Card hFull noPadding>
            <CardHeader 
              title="Informasi Administratif" 
              subtitle="Data identitas utama yang digunakan dalam ekosistem perumahan" 
              action={<Button variant="primary" size="lg" className="px-10 font-bold rounded-2xl shadow-indigo-200 shadow-lg" onClick={handleUpdate} isLoading={loading}>Simpan Perubahan</Button>}
            />
            <div className="p-8 md:p-10 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Input
                  label="Nama Lengkap Sesuai KTP"
                  value={formData.nama}
                  onChange={(e) => setFormData({...formData, nama: e.target.value})}
                  placeholder="Masukkan nama lengkap..."
                  icon={UserCircle}
                />
                <Input
                  label="Email Sistem (ReadOnly)"
                  value={formData.email}
                  disabled
                  placeholder="email@habitix.com"
                  icon={Mail}
                />
                <Input
                  label="WhatsApp / No. Telepon"
                  value={formData.telepon}
                  onChange={(e) => setFormData({...formData, telepon: e.target.value})}
                  placeholder="+62 8..."
                  icon={Phone}
                />
                <Textarea 
                  label="Alamat Domisili"
                  value={formData.alamat}
                  onChange={(e) => setFormData({...formData, alamat: e.target.value})}
                  placeholder="Masukkan alamat lengkap..."
                  className="min-h-[120px]"
                />
              </div>

              {(role === 'admin' || role === 'super_admin') && (
                <div className="pt-8 border-t border-slate-100">
                  <div className="bg-indigo-50 p-8 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden group border border-indigo-100">
                    <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl transition-all duration-1000 group-hover:scale-150"></div>
                    
                    <div className="text-center md:text-left space-y-2 relative z-10">
                      <div className="flex items-center gap-3 justify-center md:justify-start mb-2">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                            <ShieldCheck size={18} />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400">Admin Workspace</span>
                      </div>
                      <h4 className="text-2xl font-bold tracking-tight text-slate-900">Kedaulatan Komplek</h4>
                      <p className="text-sm text-slate-500 font-medium">Kelola profil perumahan dan infrastruktur digital Anda.</p>
                    </div>
                    <Button 
                      variant="primary" 
                      className="px-8 py-3 relative z-10"
                      onClick={() => window.location.href = '/my-complex'}
                    >
                      Profil Komplek
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Registration Modal */}
      <Modal
        isOpen={showRegisterResident}
        onClose={() => setShowRegisterResident(false)}
        title="Pendaftaran Warga"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleRegisterResident(); }} className="space-y-8 p-2">
          <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm shadow-indigo-100">
              <Activity className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Digital Onboarding</h4>
              <p className="text-sm text-indigo-950 font-semibold leading-snug tracking-tight">
                Hubungkan identitas Anda dengan unit rumah untuk aktivasi fitur komunitas.
              </p>
            </div>
          </div>
          
          <div className="flex flex-col gap-6">
            <Input 
              label="Unit Rumah (Blok / Nomor)"
              placeholder="Contoh: A1/10"
              value={regData.blok}
              onChange={(e) => setRegData({...regData, blok: e.target.value})}
              icon={Building2}
            />
            
            <div className="flex flex-col gap-4">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Status Kepemilikan</label>
              <div className="grid grid-cols-2 gap-4">
                {['Pemilik', 'Kontrak'].map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setRegData({...regData, status_hunian: status})}
                    className={`px-4 py-3 rounded-xl text-xs font-bold transition-all border ${
                      regData.status_hunian === status 
                        ? 'bg-slate-900 border-slate-900 text-white shadow-md' 
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-6 pt-6">
            <Button variant="ghost" className="flex-1 py-4 font-bold rounded-2xl" onClick={() => setShowRegisterResident(false)}>Batal</Button>
            <Button 
              variant="primary" 
              className="flex-1 py-4 font-bold rounded-2xl shadow-indigo-200 shadow-xl" 
              type="submit"
              isLoading={loading}
              disabled={!regData.blok}
            >
              Daftar Sekarang
            </Button>
          </div>
        </form>
      </Modal>

      {/* Password Change Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Pengaturan Keamanan"
      >
        <form onSubmit={handleUpdatePassword} className="space-y-8 p-2">
          <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm">
              <Key className="w-5 h-5" />
            </div>
            <div className="space-y-1">
               <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Identity Protection</h4>
               <p className="text-sm text-slate-900 font-semibold leading-snug">
                  Gunakan password yang kuat untuk menjaga integritas akun Anda.
               </p>
            </div>
          </div>

          <div className="space-y-6">
            <PasswordInput 
              label="Password Baru"
              required 
              value={newPassword} 
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
            />
            <PasswordInput 
              label="Konfirmasi Password Baru"
              required 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ulangi password"
            />
          </div>

          <div className="flex gap-6 pt-6">
            <Button variant="ghost" type="button" className="flex-1 py-4 font-bold rounded-2xl" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button variant="primary" type="submit" className="flex-1 py-4 font-bold rounded-2xl shadow-indigo-200 shadow-xl" isLoading={isUpdatingPassword}>
              Update Password
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
