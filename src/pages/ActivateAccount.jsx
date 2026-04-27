import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { KeyRound, ShieldCheck, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";

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
            role: 'resident'
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
    <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="p-8 text-center bg-indigo-600 text-white">
          <div className="flex justify-center mb-4">
            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
              <KeyRound className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold">Aktivasi Akun Warga</h1>
          <p className="text-indigo-100 text-sm mt-1">Gunakan email yang didaftarkan oleh pengurus komplek.</p>
        </div>

        <form onSubmit={handleActivate} className="p-8 flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email Terdaftar</label>
            <input
              type="email"
              required
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all font-medium"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Buat Password Baru</label>
            <input
              type="password"
              required
              placeholder="Minimal 8 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
          >
            {loading ? "Memproses..." : "Aktifkan Akun Saya"}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>

          <div className="text-center">
            <Link to="/login" className="text-slate-400 text-sm font-bold hover:text-indigo-600 transition-all">
              Kembali ke Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
