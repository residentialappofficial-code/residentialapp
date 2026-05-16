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
      <div className="hidden lg:flex lg:w-1/2 bg-slate-950 text-white p-16 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-white/[0.03] blur-[120px] rounded-full -mr-40 -mt-40"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-white/[0.02] blur-[100px] rounded-full -ml-40 -mb-40"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-24">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-xl">
              <ShieldCheck className="w-7 h-7 text-black" />
            </div>
            <span className="text-xl font-bold tracking-tighter">HABITIX</span>
          </div>
          
          <div className="max-w-xl">
            <h1 className="text-5xl font-bold leading-tight mb-8 tracking-tight">
              Manajemen hunian <br/>
              <span className="text-slate-500 italic">lebih modern.</span>
            </h1>
            <p className="text-xl text-slate-400 font-medium leading-relaxed">
              Platform transparan, aman, dan mutakhir yang dirancang untuk mengelola kompleksitas lingkungan perumahan dengan presisi tinggi.
            </p>
          </div>
        </div>

        <div className="relative z-10">
          <div className="flex gap-12 mb-12">
            <div className="space-y-1">
              <p className="text-3xl font-bold tracking-tighter">1.2rb+</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Unit Aktif</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold tracking-tighter">99.9%</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Waktu Aktif</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold tracking-tighter">24/7</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Dukungan Langsung</p>
            </div>
          </div>
          <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest pt-8 border-t border-white/5">
            © 2026 HABITIX. Versi 3.0.1
          </div>
        </div>
      </div>

      {/* Sisi Kanan: Form (Bahasa Indonesia & Proporsional) */}
      <div className="flex-1 flex items-center justify-center p-6 relative bg-white">
        <div className="w-full max-w-md relative z-10">
          <div className="mb-10 ml-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="px-3 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                <Sparkles className="w-3 h-3" /> Sistem Aman
              </div>
            </div>
            <h2 className="text-3xl font-bold text-slate-950 mb-2 tracking-tight">Autentikasi</h2>
            <p className="text-slate-500 font-medium text-sm">Masukkan detail akun Anda untuk masuk.</p>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50">
            <form onSubmit={handleSubmit} className="space-y-10">
              <div className="space-y-8">
                <Input 
                  label="Alamat Email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contoh@email.com"
                  icon={Mail}
                />

                <div className="space-y-2">
                  <PasswordInput 
                    label="Kata Sandi"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                  <div className="flex justify-end">
                    <button 
                      type="button" 
                      onClick={() => alert("Hubungi admin perumahan untuk reset sandi.")}
                      className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors"
                    >
                      Lupa Kata Sandi?
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-5 bg-slate-900 hover:bg-black text-white rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg shadow-slate-100 transition-all active:scale-95"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <ArrowRight className="w-4 h-4" />
                      <span>Masuk ke Platform</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="mt-10 text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Belum punya akun? <Link to="/register" className="text-slate-950 font-bold hover:text-indigo-600 ml-2">Minta Akses</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
