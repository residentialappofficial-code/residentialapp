import { useState } from "react";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Button } from "@/components/ui/Button";
import { Link, useNavigate } from "react-router-dom";
import { Mail, ShieldCheck, ArrowRight } from "lucide-react";
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
  <div className="flex min-h-screen w-full bg-slate-50 overflow-hidden">
   {/* Left Side: Branding */}
   <div className="hidden lg:flex lg:w-1/2 bg-slate-950 text-white border border-slate-900 p-16 flex-col justify-between relative">
    {/* Background Decorative */}
    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/[0.02] blur-3xl rounded-full -mr-40 -mt-40"></div>
    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-white/[0.02] blur-3xl rounded-full -ml-40 -mb-40"></div>
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/[0.03] via-transparent to-transparent"></div>

    <div className="relative z-10">
     <div className="flex items-center gap-4 mb-24">
      <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-[0_1px_2px_rgba(0,0,0,0.03)]  shadow-none">
       <ShieldCheck className="w-5 h-5 text-black" />
      </div>
      <span className="text-xl font-bold tracking-tight">SimPerumahan</span>
     </div>
     
     <div className="max-w-lg">
      <h1 className="text-3xl font-bold leading-[1.1] mb-8 tracking-tight">
       Residential management <span className="text-slate-500">made effortless.</span>
      </h1>
      <p className="text-xl text-slate-400 font-bold leading-relaxed max-w-full">
       A transparent, secure, and modern platform designed to simplify the complexities of residential living.
      </p>
     </div>
    </div>

    <div className="relative z-10">
     <div className="flex gap-12 mb-12">
      <div className="space-y-1">
       <p className="text-2xl font-bold">1.2k+</p>
       <p className="text-xs font-bold text-slate-500 ">Active Units</p>
      </div>
      <div className="space-y-1">
       <p className="text-2xl font-bold">99.9%</p>
       <p className="text-xs font-bold text-slate-500 ">Uptime Rate</p>
      </div>
      <div className="space-y-1">
       <p className="text-2xl font-bold">24/7</p>
       <p className="text-xs font-bold text-slate-500 ">System Support</p>
      </div>
     </div>
     <div className="flex justify-between text-xs font-bold text-slate-600 tracking-[0.3em]">
      <span>© 2026 SimPerumahan. v3.0.0</span>
      <div className="flex gap-8">
       <a href="#" className="hover:text-white transition-all">Terms</a>
       <a href="#" className="hover:text-white transition-all">Privacy</a>
      </div>
     </div>
    </div>
   </div>

   {/* Right Side: Form */}
   <div className="flex-1 flex items-center justify-center p-8 md:p-16 lg:p-24 relative">
    <div className="w-full max-w-md relative z-10">
     <div className="mb-12">
      <h2 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">Welcome Back</h2>
      <p className="text-slate-500 font-bold text-lg">Enter your credentials to access the portal.</p>
     </div>

     <div className="bg-white p-6 rounded-2xl border border-slate-100  shadow-none">
      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
       <div className="flex flex-col gap-2.5">
        <label className="text-xs font-bold text-slate-400  ml-1">Email Address</label>
        <div className="relative group">
         <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
          <Mail className="h-5 w-5 text-slate-300 group-focus-within:text-slate-900 transition-colors" />
         </div>
         <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="block w-full pl-14 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-slate-950/5 focus:border-slate-950 transition-all placeholder:text-slate-300"
          placeholder="name@example.com"
         />
        </div>
       </div>

       <div className="space-y-2">
        <PasswordInput
         label="Password"
         value={password}
         onChange={(e) => setPassword(e.target.value)}
         placeholder="••••••••"
         required
        />
        <div className="flex justify-end">
         <button 
          type="button" 
          onClick={() => alert("Please contact your complex administrator to reset your password.")}
          className="text-xs font-bold text-slate-400 hover:text-slate-950  transition-colors"
         >
          Forgot Password?
         </button>
        </div>
       </div>

       <Button
        type="submit"
        isLoading={loading}
        variant="primary"
        size="lg"
        className="w-full py-5 rounded-2xl text-sm font-bold"
        icon={ArrowRight}
       >
        Sign In to Dashboard
       </Button>
      </form>
     </div>

     <div className="mt-12 text-center">
      <p className="text-sm font-bold text-slate-400">
       Don't have an account? <Link to="/register" className="text-slate-950 font-bold hover:underline underline-offset-4 ml-1">Register now</Link>
      </p>
     </div>
    </div>
    
    {/* Background accents for mobile/tablet */}
    <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-slate-200/50 blur-3xl rounded-full lg:hidden"></div>
   </div>
  </div>
 );
}
