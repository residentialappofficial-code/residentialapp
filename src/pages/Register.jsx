import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, UserPlus } from "lucide-react";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nama, setNama] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error: authError } = await supabase.auth.signUp({ email, password });
      if (authError) throw authError;

      const { error: dbError } = await supabase.from('warga').insert([{
        nama,
        email,
        user_id: data.session?.user?.id || data.user?.id,
        role: 'admin',
        blok: 'OWNER-00',
        status_hunian: 'Pemilik',
      }]);
      if (dbError) throw dbError;

      toast.success("Akun berhasil dibuat! Silakan cek email konfirmasi lalu login.");
      navigate("/login");
    } catch (error) {
      toast.error("Gagal: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-neutral-50 p-4">
      <Card className="w-full max-w-md shadow-xl border-t-4 border-t-indigo-600">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg">
              <UserPlus className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">Daftar Pengelola</CardTitle>
          <CardDescription className="text-neutral-500">
            Daftarkan diri Anda sebagai Pengelola/Admin Perumahan.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleRegister}>
          <CardContent className="space-y-4 pt-4">
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
                placeholder="Minimal 6 karakter"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-3 pt-2">
            <Button
              type="submit"
              className="w-full h-11 text-white font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 transition-all"
              disabled={loading}
            >
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memproses...</>
              ) : (
                "Daftar Akun Admin"
              )}
            </Button>

            <Button variant="ghost" type="button" className="w-full text-neutral-500" asChild>
              <Link to="/login">Kembali ke Login</Link>
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
