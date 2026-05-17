import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, ShieldCheck, ArrowRight, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Input, PasswordInput } from "@/components/ui";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { error: signInError } = await signIn(email, password);
      if (signInError) throw signInError;
      navigate("/dashboard");
    } catch {
      alert("Email atau password salah.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-slate-50 overflow-hidden font-sans">
      {/* Sisi Kiri: Branding (Bahasa Indonesia) */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-950 text-white p-20 flex-col justify-between relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-white/[0.03] blur-[120px] rounded-full -mr-40 -mt-40 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-white/[0.02] blur-[100px] rounded-full -ml-40 -mb-40"></div>
        <div className="absolute top-1/4 left-1/4 w-px h-64 bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>
        
        <div className="relative z-10 slide-up-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center gap-4 mb-24 group cursor-default">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-2xl transition-transform group-hover:rotate-12">
              <ShieldCheck className="w-7 h-7 text-black" />
            </div>
            <span className="text-2xl font-black tracking-tighter">HABITIX</span>
          </div>
          
          <div className="max-w-xl">
            <h1 className="text-6xl font-black leading-[1.1] mb-8 tracking-tight">
              Manajemen hunian <br/>
              <span className="text-slate-500 italic font-medium">lebih modern.</span>
            </h1>
            <p className="text-xl text-slate-400 font-medium leading-relaxed max-w-md">
              Platform transparan, aman, dan mutakhir yang dirancang untuk mengelola kompleksitas lingkungan perumahan dengan presisi tinggi.
            </p>
          </div>
        </div>

        <div className="relative z-10 slide-up-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="flex gap-16 mb-16">
            <div className="space-y-2">
              <p className="text-4xl font-black tracking-tighter">1.2rb+</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">Unit Aktif</p>
            </div>
            <div className="space-y-2">
              <p className="text-4xl font-black tracking-tighter">99.9%</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">Waktu Aktif</p>
            </div>
            <div className="space-y-2">
              <p className="text-4xl font-black tracking-tighter">24/7</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">Dukungan</p>
            </div>
          </div>
          <div className="flex items-center gap-6 text-[10px] font-bold text-slate-600 uppercase tracking-[0.4em] pt-10 border-t border-white/5">
            <span>© 2026 HABITIX</span>
            <div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div>
            <span>Versi 3.0.3</span>
          </div>
        </div>
      </div>

      {/* Sisi Kanan: Form (Bahasa Indonesia & Proporsional) */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-16 relative bg-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full blur-3xl -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-slate-50 rounded-full blur-3xl -ml-48 -mb-48"></div>

        <div className="w-full max-w-md relative z-10 slide-up-fade-in" style={{ animationDelay: '0.3s' }}>
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="px-3 py-1.5 bg-slate-900 text-white rounded-full text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2 shadow-xl shadow-slate-900/20">
                <Sparkles className="w-3 h-3 text-amber-400" /> Sistem Terenkripsi
              </div>
            </div>
            <h2 className="text-4xl font-black text-slate-950 mb-3 tracking-tight text-gradient">Selamat Datang</h2>
            <p className="text-slate-500 font-medium text-sm">Masukkan kredensial Anda untuk mengakses portal.</p>
          </div>

          <div className="bg-white p-4 sm:p-10 rounded-2xl sm:rounded-[2.5rem] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.06)] transition-all duration-500">
            <form onSubmit={handleSubmit} className="space-y-10">
              <div className="space-y-8">
                <Input 
                  label="Alamat Email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@habitix.com"
                  icon={Mail}
                  className="rounded-2xl"
                />

                <div className="space-y-3">
                  <PasswordInput 
                    label="Kata Sandi"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="rounded-2xl"
                  />
                  <div className="flex justify-end px-1">
                    <button 
                      type="button" 
                      onClick={() => alert("Silakan hubungi administrator kompleks Anda untuk pemulihan akun.")}
                      className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors"
                    >
                      Lupa Kata Sandi?
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-5 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-4 shadow-2xl shadow-slate-900/20 transition-all active:scale-[0.98] disabled:opacity-50 group"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Masuk ke Platform</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="mt-12 text-center space-y-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
              Belum terdaftar? <Link to="/register" className="text-slate-950 font-black hover:text-indigo-600 ml-2 border-b-2 border-slate-100 hover:border-indigo-100 transition-all pb-1">Minta Akses Sekarang</Link>
            </p>
            <p className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.4em] pt-2">
              HABITIX v3.0.3
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
