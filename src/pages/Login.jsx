import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, Mail, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

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
      const { error } = await signIn(email, password);
      if (error) throw error;
      navigate("/dashboard");
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-slate-50">
      {/* Left Side: Branding */}
      <div className="hidden lg:flex flex-1 bg-slate-800 text-white p-12 flex-col justify-between relative overflow-hidden">
        {/* Background Decorative */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600 opacity-10 blur-3xl rounded-full -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600 opacity-10 blur-3xl rounded-full -ml-20 -mb-20"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight">Habitix</span>
          </div>
          
          <div className="max-w-md">
            <h1 className="text-5xl font-bold leading-tight mb-6">
              Residential management <span className="text-indigo-400">made effortless.</span>
            </h1>
            <p className="text-lg text-slate-400 font-medium">
              A transparent, secure, and modern platform designed to simplify the complexities of residential living.
            </p>
          </div>
        </div>

        <div className="relative z-10 flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
          <span>© 2026 Habitix Tech.</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white transition-all">Terms</a>
            <a href="#" className="hover:text-white transition-all">Privacy</a>
          </div>
        </div>
      </div>

      {/* Right Side: Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Welcome Back</h2>
            <p className="text-slate-500 font-medium">Enter your credentials to access the portal.</p>
          </div>

          <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-600 transition-all font-medium"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Password</label>
                  <a href="#" className="text-xs font-bold text-indigo-600 hover:underline">Forgot?</a>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-600 transition-all font-medium"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold text-sm hover:opacity-90 transition-all shadow-md flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : 'Sign In'}
              </button>
            </form>
          </div>

          <p className="mt-8 text-center text-sm font-medium text-slate-500">
            Don't have an account? <Link to="/register" className="text-indigo-600 font-bold hover:underline">Register now</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
