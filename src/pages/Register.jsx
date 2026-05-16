import { useState } from "react";
import { Button, Input, Textarea, PasswordInput } from "@/components/ui";
import { useNavigate, Link } from "react-router-dom";
import { Building2, UserPlus, ArrowRight, ShieldCheck, CheckCircle2, Sparkles } from "lucide-react";
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

      const { error: authError } = await signUp(email, password, {
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
    <div className="flex min-h-screen w-full bg-slate-50 font-sans overflow-hidden">
      {/* Left Side: Branding */}
      <div className="hidden lg:flex flex-1 bg-slate-950 text-white p-24 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[900px] h-[900px] bg-white/[0.04] rounded-full blur-[140px] -mr-96 -mt-96"></div>
        <div className="absolute bottom-0 left-0 w-[700px] h-[700px] bg-white/[0.02] rounded-full blur-[120px] -ml-64 -mb-64"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-5 mb-40">
            <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-2xl shadow-white/10">
              <ShieldCheck className="w-9 h-9 text-black" />
            </div>
            <span className="text-3xl font-bold tracking-tighter">HABITIX</span>
          </div>
          
          <div className="max-w-2xl space-y-12">
            <div className="inline-flex items-center gap-4 px-6 py-3 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl text-white/80 text-[10px] font-bold uppercase tracking-widest">
              <span className="w-2.5 h-2.5 rounded-full bg-green-400 shadow-[0_0_15px_rgba(74,222,128,0.6)] animate-pulse"></span>
              Strategic Management Infrastructure
            </div>
            <h1 className="text-7xl font-bold leading-[0.9] tracking-tight">
              Provision your <br />
              <span className="text-slate-500 italic">digital estate.</span>
            </h1>
            <p className="text-2xl text-slate-400 font-bold leading-relaxed tracking-tight max-w-lg">
              Join the elite network of property managers digitizing the future of residential living with HABITIX Platform.
            </p>

            <div className="pt-16 grid grid-cols-2 gap-12 border-t border-white/5">
              {[
                { label: "Asset Valuation", val: "Rp 14.8T+" },
                { label: "Managed Units", val: "1.2M+" }
              ].map((stat, i) => (
                <div key={i} className="space-y-3">
                  <p className="text-4xl font-bold text-white tracking-tighter">{stat.val}</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative z-10 flex justify-between items-center text-[10px] font-bold text-slate-600 uppercase tracking-[0.4em]">
          <span>© 2026 HABITIX Ecosystem</span>
          <div className="flex gap-10">
            <span className="hover:text-white transition-colors cursor-pointer">Security</span>
            <span className="hover:text-white transition-colors cursor-pointer">Compliance</span>
          </div>
        </div>
      </div>

      {/* Right Side: Form */}
      <div className="flex-1 flex items-center justify-center p-6 relative">
        <div className="w-full max-w-[560px] relative z-10">
          <div className="mb-16 text-center lg:text-left space-y-4">
            <div className="lg:hidden flex items-center justify-center gap-4 mb-12">
              <ShieldCheck className="w-12 h-12 text-slate-950" />
              <span className="text-3xl font-bold tracking-tighter">HABITIX</span>
            </div>
            <div className="flex items-center gap-3 justify-center lg:justify-start">
              <div className="px-4 py-1.5 bg-slate-950 text-white rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                <Sparkles className="w-3 h-3" /> Onboarding Phase
              </div>
            </div>
            <h2 className="text-4xl font-bold text-slate-950 tracking-tighter leading-none">Register Complex</h2>
            <p className="text-slate-500 font-bold text-lg tracking-tight">Provision your community with premium enterprise tools.</p>
          </div>

          <div className="bg-white p-10 md:p-12 rounded-2xl border border-slate-100 shadow-2xl shadow-slate-950/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-56 h-56 bg-slate-50 rounded-full blur-[100px] -mr-28 -mt-28 group-hover:bg-slate-100 transition-all duration-1000"></div>
            
            {/* Step Indicator */}
            <div className="flex items-center gap-6 mb-16 p-2 bg-slate-50/50 rounded-2xl border border-slate-100 relative z-10">
              <button 
                type="button"
                onClick={() => setStep(1)}
                className={`flex-1 flex items-center justify-center gap-3 py-5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${step === 1 ? 'bg-white text-slate-950 shadow-lg shadow-slate-900/5' : 'text-slate-300 hover:text-slate-400'}`}
              >
                <Building2 className={`w-4 h-4 ${step === 1 ? 'text-slate-950' : 'text-slate-300'}`} />
                <span>1. Legal Property</span>
              </button>
              <button 
                type="button"
                onClick={() => step === 2 || (namaPerumahan && alamatPerumahan ? setStep(2) : null)}
                className={`flex-1 flex items-center justify-center gap-3 py-5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${step === 2 ? 'bg-white text-slate-950 shadow-lg shadow-slate-900/5' : 'text-slate-300 hover:text-slate-400'}`}
              >
                <UserPlus className={`w-4 h-4 ${step === 2 ? 'text-slate-950' : 'text-slate-300'}`} />
                <span>2. Master Identity</span>
              </button>
            </div>

            <form onSubmit={handleRegister} className="flex flex-col gap-10 relative z-10">
              {step === 1 ? (
                <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-700">
                  <div className="space-y-10">
                    <Input
                      label="Property Designation Name"
                      required
                      placeholder="e.g. Cendana Luxury Estate"
                      value={namaPerumahan}
                      onChange={(e) => setNamaPerumahan(e.target.value)}
                      icon={Building2}
                      className="bg-slate-50/30"
                    />
                    <Textarea
                      label="Complete Geographical Address"
                      required
                      placeholder="Enter the complete address of the complex..."
                      value={alamatPerumahan}
                      onChange={(e) => setAlamatPerumahan(e.target.value)}
                      className="min-h-[160px] bg-slate-50/30"
                    />
                  </div>
                  <Button 
                    type="button" 
                    onClick={() => {
                      if (namaPerumahan && alamatPerumahan) setStep(2);
                      else alert("Please complete the property details!");
                    }}
                    variant="primary" 
                    size="lg"
                    className="w-full py-6 group rounded-full uppercase tracking-widest font-bold text-[10px] shadow-xl shadow-slate-950/10"
                  >
                    Proceed to Identity Setup
                    <ArrowRight className="w-5 h-5 ml-4 group-hover:translate-x-1.5 transition-transform" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-700">
                  <div className="space-y-10">
                    <Input
                      label="Master Administrator Name"
                      required
                      placeholder="Your full legal name..."
                      value={nama}
                      onChange={(e) => setNama(e.target.value)}
                      icon={CheckCircle2}
                      className="bg-slate-50/30"
                    />
                    <Input
                      label="Designated Business Email"
                      type="email"
                      required
                      placeholder="admin@property.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      icon={ShieldCheck}
                      className="bg-slate-50/30"
                    />
                    <PasswordInput
                      label="Secure Access Credential"
                      value={password}
                      onChange={(e) => validatePassword(e.target.value)}
                      error={passwordError}
                      strength={passwordStrength}
                      required
                      className="bg-slate-50/30"
                    />
                  </div>
                  <div className="flex gap-6">
                    <Button type="button" onClick={() => setStep(1)} variant="ghost" className="flex-1 py-5 text-slate-300 font-bold uppercase tracking-widest text-[10px] hover:text-slate-950 hover:bg-slate-50">Back</Button>
                    <Button 
                      type="submit" 
                      disabled={loading} 
                      variant="primary" 
                      size="lg"
                      className="flex-[2] py-5 rounded-full uppercase tracking-widest font-bold text-[10px] shadow-xl shadow-slate-950/10"
                    >
                      {loading ? "Provisioning..." : "Finalize Deployment"}
                    </Button>
                  </div>
                </div>
              )}

              <div className="text-center pt-10 border-t border-slate-50">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Already managing a complex? <Link to="/login" className="text-slate-950 font-bold hover:underline underline-offset-8 ml-2">Secure Login</Link>
                </p>
              </div>
            </form>
          </div>
        </div>
        
        {/* Background accents for mobile/tablet */}
        <div className="absolute -bottom-60 -left-60 w-96 h-96 bg-slate-200/50 blur-[140px] rounded-full lg:hidden"></div>
      </div>
    </div>
  );
}
