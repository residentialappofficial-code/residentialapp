import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, ShieldCheck, CheckCircle2, Sparkles } from "lucide-react";
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
      const { error } = await resetPassword(email);
      if (error) throw error;
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
        <div className="w-full max-w-md">
          <div className="bg-white p-12 rounded-2xl border border-slate-100 shadow-2xl shadow-slate-950/5 flex flex-col items-center text-center gap-10">
            <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-950 shadow-sm border border-slate-100">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-4">
              <h2 className="text-4xl font-bold text-slate-950 tracking-tighter leading-none">Check your email</h2>
              <p className="text-slate-500 font-bold text-lg tracking-tight leading-relaxed">
                We've sent a secure password reset link to <br/>
                <span className="text-slate-950 font-mono text-sm">{email}</span>
              </p>
            </div>
            <Link 
              to="/login" 
              className="w-full bg-slate-950 text-white border border-slate-900 py-6 rounded-full font-bold text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-950/10 flex items-center justify-center gap-3"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Authentication
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-slate-50 font-sans overflow-hidden">
      {/* Left Side: Branding */}
      <div className="hidden lg:flex flex-1 bg-slate-950 text-white p-24 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[900px] h-[900px] bg-white/[0.04] rounded-full blur-[140px] -mr-96 -mt-96"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-5 mb-32">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-2xl shadow-white/10">
              <ShieldCheck className="w-8 h-8 text-black" />
            </div>
            <span className="text-2xl font-bold tracking-tighter">HABITIX</span>
          </div>
          
          <div className="max-w-xl">
            <h1 className="text-6xl font-bold leading-[1.05] mb-10 tracking-tight">
              Restore your <br/>
              <span className="text-slate-500 italic">access point.</span>
            </h1>
            <p className="text-2xl text-slate-400 font-bold leading-relaxed tracking-tight">
              Don't worry, protocol exists for this eventuality. Enter your email and we'll provision a secure link to reset your credentials.
            </p>
          </div>
        </div>

        <div className="relative z-10 text-[10px] font-bold text-slate-600 uppercase tracking-[0.4em]">
          <span>© 2026 HABITIX. Recovery Protocol</span>
        </div>
      </div>

      {/* Right Side: Form */}
      <div className="flex-1 flex items-center justify-center p-6 relative">
        <div className="w-full max-w-md relative z-10">
          <Link to="/login" className="inline-flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-950 transition-all mb-16 group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1.5 transition-all" />
            Back to Secure Login
          </Link>

          <div className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="px-4 py-1.5 bg-slate-950 text-white rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                <Sparkles className="w-3 h-3" /> Credential Recovery
              </div>
            </div>
            <h2 className="text-4xl font-bold text-slate-950 mb-3 tracking-tighter leading-none">Reset Password</h2>
            <p className="text-slate-500 font-bold text-lg tracking-tight">We'll email you a secure link to reset your password.</p>
          </div>

          <div className="bg-white p-12 rounded-2xl border border-slate-100 shadow-2xl shadow-slate-950/5">
            <form onSubmit={handleSubmit} className="flex flex-col gap-10">
              {error && (
                <div className="bg-red-50/50 border border-red-100 text-red-600 px-6 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest">
                  {error}
                </div>
              )}
              
              <Input
                label="Registered Email Address"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                icon={Mail}
                className="bg-slate-50/50"
              />

              <Button
                type="submit"
                disabled={loading}
                isLoading={loading}
                variant="primary"
                size="lg"
                className="w-full py-6 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] shadow-xl shadow-slate-950/10"
              >
                Send Recovery Link
              </Button>
            </form>
          </div>
        </div>
        
        {/* Background accents for mobile/tablet */}
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-slate-200/50 blur-[120px] rounded-full lg:hidden"></div>
      </div>
    </div>
  );
}
