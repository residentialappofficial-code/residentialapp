import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { KeyRound, ShieldCheck, ArrowRight, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button, Input } from "@/components/ui";
import { PasswordInput } from "@/components/ui/PasswordInput";

export default function ActivateAccount() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleActivate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Sign up warga (Trigger di database akan otomatis menyambungkan ke data warga yang sudah diinput admin)
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            role: 'warga'
          }
        }
      });
      
      if (error) throw error;
      
      alert("Aktivasi berhasil! Silakan cek email Anda untuk verifikasi, lalu masuk ke aplikasi.");
      navigate("/login");
    } catch (error) {
      alert("Aktivasi gagal: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-6 font-sans overflow-hidden relative">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-slate-200/30 blur-[120px] rounded-full -mr-40 -mt-40"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-slate-200/30 blur-[120px] rounded-full -ml-40 -mb-40"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="mb-12 text-center space-y-4">
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 bg-slate-950 rounded-2xl flex items-center justify-center shadow-2xl shadow-slate-950/20">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
          </div>
          <div className="flex items-center gap-3 justify-center">
            <div className="px-4 py-1.5 bg-slate-950 text-white rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
              <Sparkles className="w-3 h-3" /> Citizen Onboarding
            </div>
          </div>
          <h2 className="text-4xl font-bold text-slate-950 tracking-tighter leading-none">Aktivasi Akun</h2>
          <p className="text-slate-500 font-bold text-lg tracking-tight">Gunakan email yang didaftarkan oleh pengurus komplek.</p>
        </div>

        <div className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-950/5">
          <form onSubmit={handleActivate} className="flex flex-col gap-10">
            <Input
              label="Email Terdaftar"
              required
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-slate-50/50"
            />

            <PasswordInput
              label="Buat Password Baru"
              required
              placeholder="Minimal 8 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-slate-50/50"
            />

            <Button
              type="submit"
              disabled={loading}
              isLoading={loading}
              variant="primary"
              size="lg"
              className="w-full py-6 rounded-full uppercase tracking-widest font-bold text-[10px] shadow-xl shadow-slate-950/10 flex items-center justify-center gap-3"
            >
              Aktifkan Akun Saya
              {!loading && <ArrowRight className="w-4 h-4" />}
            </Button>

            <div className="text-center pt-8 border-t border-slate-50">
              <Link to="/login" className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] hover:text-slate-950 transition-all">
                Kembali ke Secure Login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
