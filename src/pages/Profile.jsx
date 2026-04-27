import { useState, useEffect } from "react";
import { User, Mail, Phone, MapPin, Camera, Shield, LogOut, Key, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export default function Profile() {
  const { profile, signOut, role } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nama: profile?.nama || "",
    email: profile?.email || "",
    telepon: profile?.telepon || "",
    alamat: profile?.alamat || "",
  });

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
        .single();
      
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
      alert("Anda telah terdaftar sebagai warga!");
      window.location.reload();
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
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

  return (
    <div className="bg-transparent">
      <div className="max-w-4xl mx-auto flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Account Settings</h1>
          <p className="text-slate-500 text-sm font-medium">Manage your personal information and security preferences.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Settings */}
          <div className="w-full md:w-64 flex flex-col gap-1">
            <button className="flex items-center gap-3 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-bold text-sm shadow-sm transition-all">
              <User className="w-4 h-4" /> Personal Info
            </button>
            <button className="flex items-center gap-3 px-4 py-2.5 text-slate-500 font-bold text-sm hover:bg-slate-100 rounded-lg transition-all">
              <Shield className="w-4 h-4" /> Password & Security
            </button>
            <div className="h-px bg-slate-200 my-2" />
            <button 
              onClick={signOut}
              className="flex items-center gap-3 px-4 py-2.5 text-red-500 font-bold text-sm hover:bg-red-50 rounded-lg transition-all text-left"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>

          {/* Form Content */}
          <div className="flex-1 flex flex-col gap-6">
            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4">
              <form onSubmit={handleUpdate} className="flex flex-col gap-4">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
                      {formData.nama?.charAt(0)}
                    </div>
                    <button type="button" className="absolute -bottom-2 -right-2 bg-white p-1.5 rounded-lg border border-slate-200 shadow-sm hover:bg-slate-50">
                      <Camera className="w-4 h-4 text-slate-600" />
                    </button>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{formData.nama}</h3>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{role?.replace('_', ' ')}</p>
                    <span className="px-2 py-0.5 bg-green-50 text-green-600 rounded text-[10px] font-bold uppercase">Active Account</span>
                  </div>
                </div>

                <div className="h-px bg-slate-100" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Full Name</label>
                    <input 
                      value={formData.nama} 
                      onChange={(e) => setFormData({...formData, nama: e.target.value})}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:border-indigo-600 transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Email Address</label>
                    <input 
                      value={formData.email} 
                      disabled
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium bg-slate-50 text-slate-500 cursor-not-allowed"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Phone Number</label>
                    <input 
                      value={formData.telepon} 
                      onChange={(e) => setFormData({...formData, telepon: e.target.value})}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:border-indigo-600 transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Home Address</label>
                    <input 
                      value={formData.alamat} 
                      onChange={(e) => setFormData({...formData, alamat: e.target.value})}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:border-indigo-600 transition-all"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="bg-slate-900 text-white px-8 py-2 rounded-lg font-bold text-sm shadow-md hover:bg-slate-800 transition-all flex items-center gap-2"
                  >
                    {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                    Save Changes
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-md font-bold text-slate-900">Resident Status</h4>
                  <p className="text-xs text-slate-500 font-medium mt-1">Manage your identity as a resident in this complex.</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${isResident ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                  {isResident ? 'Registered' : 'Not Registered'}
                </span>
              </div>

              {isResident ? (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Block / House Number</p>
                    <p className="text-sm font-bold text-slate-900">{residentInfo?.blok || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Occupancy Status</p>
                    <p className="text-sm font-bold text-slate-900">{residentInfo?.status_hunian || '-'}</p>
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-indigo-50/50 rounded-xl border border-indigo-100 flex flex-col items-center text-center gap-4">
                  <p className="text-sm text-indigo-900 font-medium">
                    You are currently managing this complex but not listed as a resident. 
                    Would you like to register yourself as a resident?
                  </p>
                  <button 
                    onClick={() => setShowRegisterResident(true)}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold text-sm shadow-sm hover:bg-indigo-700 transition-all"
                  >
                    Register as Resident
                  </button>
                </div>
              )}
            </div>

            <div className="bg-slate-950 p-6 rounded-xl flex justify-between items-center text-white">
              <div className="flex flex-col gap-1">
                <p className="text-md font-bold">Complex Settings</p>
                <p className="text-xs text-slate-400">Update your housing complex identity and public information.</p>
              </div>
              <button 
                onClick={() => window.location.href = '/my-complex'}
                className="bg-white text-slate-950 px-4 py-2 rounded-lg font-bold text-sm hover:opacity-90 transition-all shadow-sm"
              >
                Manage Complex
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Registration Modal */}
      {showRegisterResident && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-200">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Daftar sebagai Warga</h3>
            <p className="text-sm text-slate-500 mb-6">Lengkapi data hunian Anda di komplek ini.</p>
            
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Blok / Nomor Rumah</label>
                <input 
                  placeholder="Contoh: A1/10"
                  value={regData.blok}
                  onChange={(e) => setRegData({...regData, blok: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-600"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status Hunian</label>
                <select 
                  value={regData.status_hunian}
                  onChange={(e) => setRegData({...regData, status_hunian: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-600"
                >
                  <option value="Pemilik">Pemilik</option>
                  <option value="Kontrak">Kontrak</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button 
                onClick={() => setShowRegisterResident(false)}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50"
              >
                Batal
              </button>
              <button 
                onClick={handleRegisterResident}
                disabled={!regData.blok}
                className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 disabled:opacity-50"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
