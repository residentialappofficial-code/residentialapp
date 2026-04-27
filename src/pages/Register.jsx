import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Building2, UserPlus, ArrowRight, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function Register() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Admin Data
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nama, setNama] = useState("");
  
  // Complex Data
  const [namaPerumahan, setNamaPerumahan] = useState("");
  const [alamatPerumahan, setAlamatPerumahan] = useState("");

  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // 1. Buat Perumahan/Komplek Baru
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

      // 2. Daftar User sebagai Admin Komplek tersebut
      const { error: authError } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            nama: nama,
            role: 'admin',
            perumahan_id: perumahan.id
          }
        }
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
    <div className="flex min-h-screen w-full bg-slate-50">
      {/* Left Side: Branding */}
      <div className="hidden lg:flex flex-1 bg-slate-800 text-white p-12 flex-col justify-between relative overflow-hidden">
        {/* Background Decorative */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600 opacity-10 blur-[100px] rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-600 opacity-10 blur-[100px] rounded-full -ml-32 -mb-32"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-500/20">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight">Habitix</span>
          </div>
          
          <div className="max-w-md">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold mb-6 uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
              Join the ecosystem
            </div>
            <h1 className="text-5xl font-bold leading-tight mb-6">
              Start your journey <br />
              <span className="text-indigo-400 font-black">to digital management.</span>
            </h1>
            <p className="text-lg text-slate-400 font-medium leading-relaxed">
              Join thousands of complex managers who have digitalized their residential management with Habitix.
            </p>
          </div>
        </div>

        <div className="relative z-10 flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          <span>© 2026 Habitix Tech.</span>
          <span>Habitix v1.0</span>
        </div>
      </div>

      {/* Right Side: Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50/50">
        <div className="w-full max-w-lg">
          <div className="mb-10 text-center lg:text-left">
            <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
              <ShieldCheck className="w-8 h-8 text-indigo-600" />
              <span className="text-xl font-bold">Habitix</span>
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Daftarkan Komplek</h2>
            <p className="text-slate-500 font-medium">Lengkapi data untuk membuat dashboard manajemen Anda.</p>
          </div>

          <div className="bg-white p-8 md:p-10 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50">
            {/* Step Indicator */}
            <div className="flex items-center gap-4 mb-10 p-1 bg-slate-50 rounded-2xl border border-slate-100">
              <div className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${step === 1 ? 'bg-white text-indigo-600 shadow-sm border border-slate-100' : 'text-slate-400'}`}>
                <Building2 className="w-4 h-4" />
                <span>1. Data Komplek</span>
              </div>
              <div className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${step === 2 ? 'bg-white text-indigo-600 shadow-sm border border-slate-100' : 'text-slate-400'}`}>
                <UserPlus className="w-4 h-4" />
                <span>2. Data Admin</span>
              </div>
            </div>

            <form onSubmit={handleRegister} className="flex flex-col gap-8">
              {step === 1 ? (
                <>
                  <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nama Perumahan / Komplek</label>
                      <input
                        required
                        placeholder="Contoh: Cendana Residence"
                        value={namaPerumahan}
                        onChange={(e) => setNamaPerumahan(e.target.value)}
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all font-medium placeholder:text-slate-300"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Alamat Lengkap</label>
                      <textarea
                        required
                        placeholder="Masukkan alamat lengkap komplek..."
                        value={alamatPerumahan}
                        onChange={(e) => setAlamatPerumahan(e.target.value)}
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all font-medium h-32 resize-none placeholder:text-slate-300"
                      />
                    </div>
                  </div>
                  <Button 
                    type="button" 
                    onClick={() => step === 1 && namaPerumahan && alamatPerumahan ? setStep(2) : alert("Harap lengkapi data komplek!")}
                    variant="primary" 
                    className="w-full py-4 group rounded-2xl"
                  >
                    Lanjut ke Data Admin
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nama Lengkap Admin</label>
                      <input
                        required
                        placeholder="Masukkan nama lengkap Anda..."
                        value={nama}
                        onChange={(e) => setNama(e.target.value)}
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all font-medium placeholder:text-slate-300"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Bisnis / Pribadi</label>
                      <input
                        type="email"
                        required
                        placeholder="email@komplek.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all font-medium placeholder:text-slate-300"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Password</label>
                      <input
                        type="password"
                        required
                        placeholder="Minimal 8 karakter"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all font-medium placeholder:text-slate-300"
                      />
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <Button type="button" onClick={() => setStep(1)} variant="outline" className="flex-1 py-4 text-slate-500 border-slate-200 rounded-2xl bg-white shadow-none hover:bg-slate-50">Kembali</Button>
                    <Button 
                      type="submit" 
                      disabled={loading} 
                      variant="primary" 
                      className="flex-[2] py-4 rounded-2xl"
                    >
                      {loading ? "Mendaftarkan..." : "Selesaikan Pendaftaran"}
                    </Button>
                  </div>
                </>
              )}

              <div className="text-center pt-4 border-t border-slate-100">
                <p className="text-sm font-medium text-slate-500">
                  Sudah punya akun? <Link to="/login" className="text-indigo-600 font-bold hover:underline">Masuk di sini</Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function Button({ children, variant = "primary", className = "", icon: Icon, ...props }) {
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200",
    outline: "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50",
  };
  
  return (
    <button 
      className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  );
}
