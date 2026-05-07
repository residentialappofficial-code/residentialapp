import React, { useState } from 'react';
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Button } from "@/components/ui/Button";
import { useNavigate, Link } from "react-router-dom";
import { Building2, UserPlus, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export default function Register() {
 const [step, setStep] = useState(1);
 const [loading, setLoading] = useState(false);
 
 // Admin Data
 const [email, setEmail] = useState("");
 const [password, setPassword] = useState("");
 const [nama, setNama] = useState("");
 const [passwordError, setPasswordError] = useState("");
 const [passwordStrength, setPasswordStrength] = useState(0);
 
 // Complex Data
 const [namaPerumahan, setNamaPerumahan] = useState("");
 const [alamatPerumahan, setAlamatPerumahan] = useState("");

 const { signUp } = useAuth();
 const navigate = useNavigate();

 const validatePassword = (pass) => {
  setPassword(pass);
  let strength = 0;
  if (pass.length >= 8) strength++;
  if (/[A-Z]/.test(pass)) strength++;
  if (/[0-9]/.test(pass)) strength++;
  setPasswordStrength(strength);

  if (pass.length < 8) {
   setPasswordError("Password minimal 8 karakter");
  } else if (!/[A-Z]/.test(pass)) {
   setPasswordError("Harus mengandung minimal satu huruf besar");
  } else if (!/[0-9]/.test(pass)) {
   setPasswordError("Harus mengandung minimal satu angka");
  } else {
   setPasswordError("");
  }
 };

 const handleRegister = async (e) => {
  if (e) e.preventDefault();
  setLoading(true);
  
  try {
   const { data: perumahan, error: pError } = await supabase
    .from('perumahan')
    .insert({
     nama: namaPerumahan,
     alamat: alamatPerumahan,
     status: 'active'
    })
    .select()
    .single();

   if (pError) throw pError;

   const { data: authData, error: authError } = await signUp(email, password, {
    nama: nama,
    role: 'admin',
    perumahan_id: perumahan.id
   });

   if (authError) throw authError;

   alert("Pendaftaran Berhasil! Komplek " + namaPerumahan + " telah dibuat. Silakan cek email untuk verifikasi.");
   navigate("/login");
  } catch (error) {
   alert("Gagal mendaftar: " + error.message);
  } finally {
   setLoading(false);
  }
 };

 return (
  <div className="flex min-h-screen w-full bg-white lg:bg-slate-50">
   {/* Left Side: Branding */}
   <div className="hidden lg:flex flex-1 bg-slate-950 text-white border border-slate-900 p-20 flex-col justify-between relative overflow-hidden">
    <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-slate-900/50 rounded-full blur-[120px] -mr-96 -mt-96 animate-pulse"></div>
    <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-slate-800/30 rounded-full blur-[100px] -ml-64 -mb-64"></div>

    <div className="relative z-10">
     <div className="flex items-center gap-4 mb-24">
      <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-[0_1px_2px_rgba(0,0,0,0.03)]  shadow-none transition-transform hover:scale-105 duration-500">
       <ShieldCheck className="w-5 h-5 text-black" />
      </div>
      <span className="text-xl font-bold tracking-tighter">SimPerumahan</span>
     </div>
     
     <div className="max-w-lg space-y-10">
      <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-white/60 text-xs font-bold ">
       <span className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_12px_rgba(74,222,128,0.5)]"></span>
       Modern Management Ecosystem
      </div>
      <h1 className="text-4xl font-bold leading-[0.95] tracking-tighter">
       Build your <br />
       <span className="text-slate-500">digital estate.</span>
      </h1>
      <p className="text-xl text-slate-400 font-medium leading-relaxed">
       Join the network of property managers digitizing the future of residential living.
      </p>

      <div className="pt-10 grid grid-cols-2 gap-8">
       {[
        { label: "Total Assets", val: "Rp 12.4T+" },
        { label: "Active Units", val: "850K+" }
       ].map((stat, i) => (
        <div key={i} className="space-y-1">
         <p className="text-xl font-bold text-white">{stat.val}</p>
         <p className="text-xs font-bold text-slate-500 ">{stat.label}</p>
        </div>
       ))}
      </div>
     </div>
    </div>

    <div className="relative z-10 flex justify-between text-xs font-bold text-slate-600 tracking-[0.3em]">
     <span>© 2026 SimPerumahan.</span>
     <div className="flex gap-6">
      <span className="hover:text-white transition-colors cursor-pointer">Privacy</span>
      <span className="hover:text-white transition-colors cursor-pointer">Terms</span>
     </div>
    </div>
   </div>

   {/* Right Side: Form */}
   <div className="flex-1 flex items-center justify-center p-6 md:p-12">
    <div className="w-full max-w-[540px]">
     <div className="mb-12 text-center lg:text-left space-y-2">
      <div className="lg:hidden flex items-center justify-center gap-3 mb-10">
       <ShieldCheck className="w-10 h-10 text-slate-950" />
       <span className="text-2xl font-bold tracking-tighter">SimPerumahan</span>
      </div>
      <h2 className="text-2xl font-bold text-slate-950 tracking-tight">Register Complex</h2>
      <p className="text-slate-500 font-bold text-sm">Empower your community with premium digital tools.</p>
     </div>

     <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-100  shadow-none relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-40 h-40 bg-slate-50 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-slate-100 transition-colors duration-700"></div>
      
      {/* Step Indicator */}
      <div className="flex items-center gap-6 mb-12 p-1.5 bg-slate-50 rounded-xl border border-slate-100 relative z-10">
       <button 
        type="button"
        onClick={() => setStep(1)}
        className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-xl text-xs font-bold  transition-all ${step === 1 ? 'bg-white text-slate-950  shadow-none border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
       >
        <Building2 className={`w-4 h-4 ${step === 1 ? 'text-slate-950' : 'text-slate-300'}`} />
        <span>1. Property</span>
       </button>
       <button 
        type="button"
        onClick={() => step === 2 || (namaPerumahan && alamatPerumahan ? setStep(2) : null)}
        className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-xl text-xs font-bold  transition-all ${step === 2 ? 'bg-white text-slate-950  shadow-none border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
       >
        <UserPlus className={`w-4 h-4 ${step === 2 ? 'text-slate-950' : 'text-slate-300'}`} />
        <span>2. Account</span>
       </button>
      </div>

      <form onSubmit={handleRegister} className="flex flex-col gap-6 relative z-10">
       {step === 1 ? (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
         <div className="space-y-8">
          <div className="flex flex-col gap-2">
           <label className="text-xs font-bold text-slate-400  ml-1">Property Name</label>
           <input
            required
            placeholder="e.g. Cendana Luxury Estate"
            value={namaPerumahan}
            onChange={(e) => setNamaPerumahan(e.target.value)}
            className="w-full px-5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-950 focus:outline-none focus:ring-4 focus:ring-slate-950/5 focus:border-slate-950 transition-all placeholder:text-slate-300"
           />
          </div>
          <div className="flex flex-col gap-2">
           <label className="text-xs font-bold text-slate-400  ml-1">Complete Address</label>
           <textarea
            required
            placeholder="Enter the complete address of the complex..."
            value={alamatPerumahan}
            onChange={(e) => setAlamatPerumahan(e.target.value)}
            className="w-full px-5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-950 focus:outline-none focus:ring-4 focus:ring-slate-950/5 focus:border-slate-950 transition-all min-h-[140px] resize-none placeholder:text-slate-300"
           />
          </div>
         </div>
         <Button 
          type="button" 
          onClick={() => {
           if (namaPerumahan && alamatPerumahan) setStep(2);
           else alert("Please complete the property details!");
          }}
          variant="primary" 
          size="lg"
          className="w-full py-3 group rounded-xl  shadow-none"
         >
          Next to Account Setup
          <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
         </Button>
        </div>
       ) : (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
         <div className="space-y-8">
          <div className="flex flex-col gap-2">
           <label className="text-xs font-bold text-slate-400  ml-1">Administrator Name</label>
           <input
            required
            placeholder="Your full legal name..."
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            className="w-full px-5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-950 focus:outline-none focus:ring-4 focus:ring-slate-950/5 focus:border-slate-950 transition-all placeholder:text-slate-300"
           />
          </div>
          <div className="flex flex-col gap-2">
           <label className="text-xs font-bold text-slate-400  ml-1">Business Email</label>
           <input
            type="email"
            required
            placeholder="admin@property.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-950 focus:outline-none focus:ring-4 focus:ring-slate-950/5 focus:border-slate-950 transition-all placeholder:text-slate-300"
           />
          </div>
          <PasswordInput
           label="Secure Password"
           value={password}
           onChange={(e) => validatePassword(e.target.value)}
           error={passwordError}
           strength={passwordStrength}
           required
           className="rounded-xl"
          />
         </div>
         <div className="flex gap-4">
          <Button type="button" onClick={() => setStep(1)} variant="ghost" className="flex-1 py-3 text-slate-400 font-bold  rounded-xl hover:bg-slate-50">Back</Button>
          <Button 
           type="submit" 
           disabled={loading} 
           variant="primary" 
           size="lg"
           className="flex-[2] py-3 rounded-xl  shadow-none"
          >
           {loading ? "Deploying..." : "Complete Setup"}
          </Button>
         </div>
        </div>
       )}

       <div className="text-center pt-8 border-t border-slate-50">
        <p className="text-xs font-bold text-slate-400">
         Already managing? <Link to="/login" className="text-slate-950 font-bold hover:underline underline-offset-4 ml-1">Log in here</Link>
        </p>
       </div>
      </form>
     </div>
    </div>
   </div>
  </div>
 );
}
