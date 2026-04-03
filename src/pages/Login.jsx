import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";

// mode: "login" | "register" | "setup"
export default function Login() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nama, setNama] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Login berhasil!");
      navigate("/");
    } catch (error) {
      toast.error("Gagal Login: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    const role = mode === "setup" ? "super_admin" : "admin";
    try {
      const { data, error: authError } = await supabase.auth.signUp({ email, password });
      if (authError) throw authError;

      const { error: dbError } = await supabase.from('warga').insert([{
        nama,
        email,
        user_id: data.session?.user?.id || data.user?.id,
        role,
        blok: role === "super_admin" ? "ADMIN-00" : "OWNER-00",
        status_hunian: "Pemilik",
      }]);
      if (dbError) throw dbError;

      toast.success("Akun berhasil dibuat! Silakan cek email konfirmasi lalu login.");
      setMode("login");
    } catch (error) {
      toast.error("Gagal: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const isRegMode = mode === "register" || mode === "setup";
  const cardBorderClass = mode === "setup" ? "border-t-green-600" : mode === "register" ? "border-t-indigo-600" : "border-t-blue-600";
  const iconBgClass = mode === "setup" ? "bg-green-600" : mode === "register" ? "bg-indigo-600" : "bg-blue-600";
  const btnClass = mode === "setup" ? "bg-green-600 hover:bg-green-700" : mode === "register" ? "bg-indigo-600 hover:bg-indigo-700" : "bg-blue-600 hover:bg-blue-700";

  const titles = {
    login: "SimPerumahan",
    register: "Daftar Pengelola",
    setup: "Setup Super Admin",
  };

  const descriptions = {
    login: "Sistem Informasi Manajemen Perumahan & Paguyuban",
    register: "Daftarkan diri Anda sebagai Pengelola/Admin Perumahan.",
    setup: "Buat akun administrator utama untuk pengelolaan penuh.",
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-neutral-50 p-4">
      <Card className={`w-full max-w-md shadow-xl border-t-4 ${cardBorderClass}`}>
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className={`${iconBgClass} p-3 rounded-2xl shadow-lg`}>
              <ShieldCheck className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">{titles[mode]}</CardTitle>
          <CardDescription className="text-neutral-500">{descriptions[mode]}</CardDescription>
        </CardHeader>

        <form onSubmit={isRegMode ? handleRegister : handleLogin}>
          <CardContent className="space-y-4 pt-4">
            {isRegMode && (
              <div className="space-y-2">
                <Label htmlFor="nama">Nama Lengkap</Label>
                <Input
                  id="nama"
                  placeholder="Contoh: Budi Santoso"
                  required
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Alamat Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nama@email.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Kata Sandi</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-3 pt-2">
            <Button
              type="submit"
              className={`w-full h-11 text-white font-semibold rounded-lg transition-all ${btnClass}`}
              disabled={loading}
            >
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memproses...</>
              ) : (
                mode === "login" ? "Masuk ke Dashboard"
                  : mode === "register" ? "Daftar Akun Admin"
                  : "Buat Super Admin"
              )}
            </Button>

            {isRegMode ? (
              <Button variant="ghost" type="button" className="w-full text-neutral-500" onClick={() => setMode("login")}>
                Kembali ke Login
              </Button>
            ) : (
              <div className="flex flex-col items-center w-full pt-1">
                <Button variant="link" type="button" className="text-indigo-600 font-semibold h-auto py-0"
                  onClick={() => setMode("register")}>
                  Daftar sebagai Pengelola Perumahan
                </Button>
              </div>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
