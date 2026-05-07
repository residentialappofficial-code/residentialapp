import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, ShieldCheck, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

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
   <div className="flex min-h-screen w-full bg-slate-50 items-center justify-center p-8">
    <div className="w-full max-w-full text-center">
     <div className="bg-white p-8 rounded-2xl border border-slate-200  flex flex-col items-center gap-6">
      <div className="w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center shadow-[0_1px_2px_rgba(0,0,0,0.03)] text-black">
       <CheckCircle2 className="w-5 h-5" />
      </div>
      <div>
       <h2 className="text-2xl font-bold text-slate-900 mb-2">Check your email</h2>
       <p className="text-slate-500 font-medium">
        We've sent a password reset link to <span className="text-black font-bold">{email}</span>.
       </p>
      </div>
      <Link 
       to="/login" 
       className="w-full bg-slate-950 text-white border border-slate-900 py-3 rounded-lg font-bold text-sm hover:bg-black transition-all  flex items-center justify-center gap-2"
      >
       Back to Login
      </Link>
     </div>
    </div>
   </div>
  );
 }

 return (
  <div className="flex min-h-screen w-full bg-slate-50">
   {/* Left Side: Branding */}
   <div className="hidden lg:flex flex-1 bg-slate-950 text-white border border-slate-900 p-12 flex-col justify-between relative overflow-hidden">
    <div className="relative z-10">
     <div className="flex items-center gap-3 mb-16">
      <div className="bg-white p-2 rounded-lg">
       <ShieldCheck className="w-5 h-5 text-black" />
      </div>
      <span className="text-2xl font-bold tracking-tight">Habitix</span>
     </div>
     
     <div className="max-w-full">
      <h1 className="text-2xl font-bold leading-tight mb-6">
       Forgot your <span className="text-slate-400">password?</span>
      </h1>
      <p className="text-lg text-slate-400 font-medium">
       Don't worry, it happens to the best of us. Just enter your email and we'll send you a link to reset it.
      </p>
     </div>
    </div>

    <div className="relative z-10 text-xs font-bold text-slate-500 ">
     <span>© 2026 Habitix Tech.</span>
    </div>
   </div>

   {/* Right Side: Form */}
   <div className="flex-1 flex items-center justify-center p-8">
    <div className="w-full max-w-full">
     <Link to="/login" className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-black transition-all mb-8 group">
      <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-all" />
      Back to Login
     </Link>

     <div className="mb-8">
      <h2 className="text-xl font-bold text-slate-900 mb-2">Reset Password</h2>
      <p className="text-slate-500 font-medium">We'll email you a secure link to reset your password.</p>
     </div>

     <div className="bg-white p-6 rounded-xl border border-slate-200 ">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
       {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 px-5 py-2.5 rounded-lg text-xs font-bold ">
         {error}
        </div>
       )}
       
       <div className="flex flex-col gap-2">
        <label className="text-xs font-bold text-slate-700 ">Email Address</label>
        <div className="relative">
         <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Mail className="h-4 w-4 text-slate-400" />
         </div>
         <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-black transition-all font-medium"
          placeholder="name@example.com"
         />
        </div>
       </div>

       <button
        type="submit"
        disabled={loading}
        className="w-full bg-slate-950 text-white border border-slate-900 py-3 rounded-lg font-bold text-sm hover:bg-black transition-all  flex items-center justify-center gap-2"
       >
        {loading ? (
         <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        ) : 'Send Reset Link'}
       </button>
      </form>
     </div>
    </div>
   </div>
  </div>
 );
}
