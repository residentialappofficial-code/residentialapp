import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, ArrowRight, ShieldCheck, CheckCircle2, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button, Input } from "@/components/ui";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      setLoading(true);
      const { error: resetError } = await resetPassword(email);
      if (resetError) throw resetError;
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex min-h-screen w-full bg-slate-50 items-center justify-center p-6 font-sans">
        <div className="w-full max-w-md slide-up-fade-in">
          <div className="bg-white p-12 rounded-[2.5rem] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.04)] flex flex-col items-center text-center gap-10">
            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-950 shadow-sm border border-slate-100">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
            <div className="space-y-4">
              <h2 className="text-4xl font-black text-slate-950 tracking-tight text-gradient">Cek Email Anda</h2>
              <p className="text-slate-500 font-medium text-sm leading-relaxed">
                Kami telah mengirimkan tautan pemulihan sandi yang aman ke <br/>
                <span className="text-slate-900 font-bold">{email}</span>
              </p>
            </div>
            <Link 
              to="/login" 
              className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-black transition-all shadow-2xl shadow-slate-900/20 flex items-center justify-center gap-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-slate-50 font-sans overflow-hidden">
      {/* Left Side: Branding */}
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
              Restore your <br/>
              <span className="text-slate-500 italic font-medium">access point.</span>
            </h1>
            <p className="text-xl text-slate-400 font-medium leading-relaxed max-w-md">
              Jangan khawatir, protokol pemulihan tersedia untuk situasi ini. Masukkan email Anda untuk mendapatkan tautan aman.
            </p>
          </div>
        </div>

        <div className="relative z-10 slide-up-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center gap-6 text-[10px] font-bold text-slate-600 uppercase tracking-[0.4em] pt-10 border-t border-white/5">
            <span>© 2026 HABITIX</span>
            <div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div>
            <span>Versi 3.0.3</span>
          </div>
        </div>
      </div>

      {/* Right Side: Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-16 relative bg-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full blur-3xl -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-slate-50 rounded-full blur-3xl -ml-48 -mb-48"></div>

        <div className="w-full max-w-md relative z-10 slide-up-fade-in" style={{ animationDelay: '0.3s' }}>
          <Link to="/login" className="inline-flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-950 transition-all mb-12 group px-1">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1.5 transition-all" />
            Kembali ke Login
          </Link>

          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="px-3 py-1.5 bg-slate-900 text-white rounded-full text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2 shadow-xl shadow-slate-900/20">
                <Sparkles className="w-3 h-3 text-amber-400" /> Credential Recovery
              </div>
            </div>
            <h2 className="text-4xl font-black text-slate-950 mb-3 tracking-tight text-gradient">Lupa Kata Sandi</h2>
            <p className="text-slate-500 font-medium text-sm">Kami akan mengirimkan tautan pemulihan ke email Anda.</p>
          </div>

          <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.04)]">
            <form onSubmit={handleSubmit} className="flex flex-col gap-10">
              {error && (
                <div className="bg-rose-50 border border-rose-100 text-rose-600 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest">
                  {error}
                </div>
              )}
              
              <Input
                label="Alamat Email Terdaftar"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@habitix.com"
                icon={Mail}
                className="rounded-2xl"
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-4 shadow-2xl shadow-slate-900/20 transition-all active:scale-[0.98] disabled:opacity-50 group"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Kirim Tautan Pemulihan</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
