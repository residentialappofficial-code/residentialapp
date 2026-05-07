import { useState, useEffect } from "react";
import { User, Mail, Phone, MapPin, Camera, Shield, LogOut, Key, ChevronRight, CheckCircle2, Building2, UserCircle, Briefcase, Activity } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button, Input, Card, CardHeader, Modal } from "@/components/ui";

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

 return (
  <div className="max-w-full mx-auto flex flex-col gap-6">
   {/* Header */}
   <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
    <div>
     <h1 className="text-xl font-bold text-slate-900 tracking-tight">User Profile</h1>
     <p className="text-slate-500 text-sm font-medium">Manage your professional identity and security credentials.</p>
    </div>
    <div className="flex gap-4">
     <Button variant="ghost" icon={LogOut} className="text-red-500 font-bold hover:bg-red-50" onClick={signOut}>Sign Out</Button>
     <Button variant="primary" size="lg" icon={Shield}>Security Settings</Button>
    </div>
   </div>

   <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
    {/* Left: Profile Overview */}
    <div className="lg:col-span-4 flex flex-col gap-8">
     <Card className="text-center p-6 relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-full h-32 bg-slate-950 transition-all group-hover:h-36"></div>
      <div className="relative flex flex-col items-center">
       <div className="relative mb-8 mt-4">
        <div className="w-32 h-32 bg-white p-1.5 rounded-2xl  relative z-10 transition-transform group-hover:scale-105 duration-500">
         <div className="w-full h-full bg-slate-900 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-none">
          {formData.nama?.charAt(0)}
         </div>
        </div>
        <button className="absolute -bottom-2 -right-2 bg-slate-950 p-3 rounded-2xl border-4 border-white  text-white z-20 hover:scale-110 transition-all hover:bg-black active:scale-95">
         <Camera className="w-5 h-5" />
        </button>
       </div>
       <h3 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">{formData.nama}</h3>
       <p className="text-xs font-bold text-slate-400 tracking-[0.3em] mb-6">{role?.replace('_', ' ')}</p>
       
       <div className="flex items-center gap-2 px-5 py-2.5 bg-green-50 text-green-600 rounded-full text-xs font-bold  border border-green-100/50 ">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        Account Verified
       </div>
      </div>
     </Card>

     <Card noPadding>
      <CardHeader title="Residential Context" subtitle="Verified status in this complex" />
      <div className="p-8 flex flex-col gap-6">
       <div className={`flex items-center justify-between p-5 rounded-xl border transition-all ${isResident ? 'bg-green-50/50 border-green-100  shadow-green-100/20' : 'bg-slate-50/50 border-slate-100'}`}>
        <div className="flex items-center gap-4">
         <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-[0_1px_2px_rgba(0,0,0,0.03)]  transition-transform ${isResident ? 'bg-green-600 text-white shadow-none' : 'bg-slate-400 text-white shadow-none'}`}>
          <Building2 className="w-5 h-5" />
         </div>
         <div className="flex flex-col">
          <span className={`text-xs font-bold  ${isResident ? 'text-green-600' : 'text-slate-400'}`}>
           {isResident ? 'Registered Resident' : 'Unregistered'}
          </span>
          <span className="text-sm font-bold text-slate-900">
           {isResident ? 'Active Warga' : 'Guest Status'}
          </span>
         </div>
        </div>
        {isResident && <CheckCircle2 className="w-5 h-5 text-green-600" />}
       </div>

       {isResident ? (
        <div className="space-y-4">
         <div className="flex justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100/50 group/item hover:bg-slate-100 transition-colors">
          <span className="text-xs font-bold text-slate-400  self-center">Home Unit</span>
          <span className="text-sm font-bold text-slate-900 group-hover:scale-105 transition-transform">{residentInfo?.blok || '-'}</span>
         </div>
         <div className="flex justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100/50 group/item hover:bg-slate-100 transition-colors">
          <span className="text-xs font-bold text-slate-400  self-center">Occupancy</span>
          <span className="text-sm font-bold text-slate-900 group-hover:scale-105 transition-transform">{residentInfo?.status_hunian || '-'}</span>
         </div>
        </div>
       ) : (
        <div className="text-center space-y-6 pt-4">
         <p className="text-xs text-slate-400 font-bold leading-relaxed px-4">
          Complete your residential registration to access all community features and billing systems.
         </p>
         <Button 
          variant="primary" 
          className="w-full py-3 rounded-2xl  shadow-none"
          onClick={() => setShowRegisterResident(true)}
         >
          Complete Registration
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
       title="Identity & Credentials" 
       subtitle="Update your core administrative information" 
       action={<Button variant="primary" size="lg" onClick={handleUpdate} isLoading={loading} className="px-8  shadow-none">Save Changes</Button>}
      />
      <div className="p-6 space-y-12">
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
         label="Legal Full Name"
         value={formData.nama}
         onChange={(e) => setFormData({...formData, nama: e.target.value})}
         placeholder="Enter your full name"
         icon={UserCircle}
         className="bg-white border-slate-100"
        />
        <Input
         label="Registered Email"
         value={formData.email}
         disabled
         placeholder="email@example.com"
         icon={Mail}
         className="bg-slate-50 border-transparent opacity-70"
        />
        <Input
         label="Primary Contact"
         value={formData.telepon}
         onChange={(e) => setFormData({...formData, telepon: e.target.value})}
         placeholder="+62 812..."
         icon={Phone}
         className="bg-white border-slate-100"
        />
        <Input
         label="Physical Address"
         value={formData.alamat}
         onChange={(e) => setFormData({...formData, alamat: e.target.value})}
         placeholder="Enter your home address"
         icon={MapPin}
         className="bg-white border-slate-100"
        />
       </div>

       <div className="pt-10 border-t border-slate-50">
        <div className="bg-slate-950 p-6 rounded-2xl text-white flex flex-col md:flex-row justify-between items-center gap-8  shadow-none relative overflow-hidden group">
         <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-3xl transition-all group-hover:scale-150"></div>
         <div className="text-center md:text-left space-y-3 relative z-10">
          <h4 className="text-2xl font-bold tracking-tight">Residential Ecosystem</h4>
          <p className="text-xs text-white/50 font-bold  max-w-full">Access complex-specific analytical data and administrative tools.</p>
         </div>
         <Button 
          variant="outline" 
          className="bg-white text-slate-950 border-none hover:bg-slate-50 min-w-[200px] py-3 rounded-2xl font-bold  text-xs  relative z-10"
          onClick={() => window.location.href = '/my-complex'}
         >
          Manage Ecosystem
         </Button>
        </div>
       </div>
      </div>
     </Card>
    </div>
   </div>

   {/* Registration Modal */}
   <Modal
    isOpen={showRegisterResident}
    onClose={() => setShowRegisterResident(false)}
    title="Residential Onboarding"
   >
    <div className="space-y-8 p-2">
     <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex items-center gap-4">
      <div className="w-10 h-10 bg-slate-950 rounded-2xl flex items-center justify-center text-white">
       <Activity className="w-5 h-5" />
      </div>
      <p className="text-xs text-slate-500 font-bold leading-relaxed">
       Please provide your housing unit details to link your account with the community database.
      </p>
     </div>
     
     <div className="flex flex-col gap-8">
      <Input 
       label="Housing Unit (Blok / Nomor)"
       placeholder="Example: A1/10"
       value={regData.blok}
       onChange={(e) => setRegData({...regData, blok: e.target.value})}
       icon={Building2}
      />
      
      <div className="flex flex-col gap-3">
       <label className="text-xs font-bold text-slate-400 ">Ownership Type</label>
       <div className="grid grid-cols-2 gap-4">
        {['Pemilik', 'Kontrak'].map((status) => (
         <button
          key={status}
          onClick={() => setRegData({...regData, status_hunian: status})}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold  transition-all border-2 ${
           regData.status_hunian === status 
            ? 'bg-slate-950 border-slate-950 text-white ' 
            : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
          }`}
         >
          {status}
         </button>
        ))}
       </div>
      </div>
     </div>

     <div className="flex gap-4 pt-6">
      <Button variant="ghost" className="flex-1 py-3 font-bold  text-xs" onClick={() => setShowRegisterResident(false)}>Cancel</Button>
      <Button 
       variant="primary" 
       className="flex-1 py-3  shadow-none font-bold  text-xs" 
       onClick={handleRegisterResident}
       isLoading={loading}
       disabled={!regData.blok}
      >
       Finalize Registration
      </Button>
     </div>
    </div>
   </Modal>
  </div>
 );
}
