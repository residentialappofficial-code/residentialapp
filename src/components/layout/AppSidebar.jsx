import { 
 LayoutDashboard, 
 Users, 
 Banknote, 
 WalletCards, 
 UserCog, 
 MessageSquare,
 Building2,
 LogOut,
 User,
 Briefcase,
 Settings,
 ShieldCheck,
 FileText,
 Megaphone,
 MessageSquareWarning,
 Hammer
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function AppSidebar() {
 const { signOut, role } = useAuth();
 const location = useLocation();

 const menuGroups = [
  {
   name: "Resident Section",
   items: [
    { icon: LayoutDashboard, label: "Dashboard", to: "/" },
    { icon: Banknote, label: "Tagihan Saya", to: "/iuran" },
    { icon: MessageSquareWarning, label: "Lapor Keluhan", to: "/complaints" },
    { icon: Hammer, label: "Pinjam Alat", to: "/assets" },
    { icon: Megaphone, label: "Pengumuman", to: "/announcements" },
    { icon: MessageSquare, label: "Forum", to: "/forum" },
   ]
  },
  {
   name: "Admin Section",
   roles: ["admin", "super_admin"],
   items: [
    { icon: Building2, label: "My Complex", to: "/my-complex", roles: ["admin"] },
    { icon: Building2, label: "All Complexes", to: "/manage-complexes", roles: ["super_admin"] },
    { icon: Users, label: "Manajemen Warga", to: "/warga" },
    { icon: ShieldCheck, label: "Verifikasi Bayar", to: "/verify-payments" },
    { icon: FileText, label: "Kelola Tagihan", to: "/manage-bills" },
    { icon: Settings, label: "Konfigurasi Iuran", to: "/iuran-config" },
    { icon: WalletCards, label: "Arus Kas", to: "/kas" },
    { icon: Briefcase, label: "Penggajian", to: "/penggajian" },
    { icon: UserCog, label: "Staff & Pengurus", to: "/pengurus" },
   ]
  },
  {
   name: "System",
   items: [
    { icon: User, label: "Profile", to: "/profile" },
    { icon: Settings, label: "Settings", to: "/settings" },
   ]
  }
 ];

 return (
  <aside className="fixed left-0 top-0 w-64 h-screen bg-gradient-to-b from-[#020617] via-[#0f172a] to-[#020617] text-white flex flex-col z-50 border-r border-white/5">
   {/* Sidebar Header */}
   <div className="px-5 py-2.5 flex items-center gap-3 border-b border-white/5">
    <div className="bg-white p-2 rounded-lg">
     <ShieldCheck className="w-5 h-5 text-black" />
    </div>
    <span className="font-bold text-xl tracking-tight">Habitix</span>
   </div>

   {/* Sidebar Content */}
   <div className="flex-1 overflow-y-auto px-5 py-2.5">
    {menuGroups.filter(group => !group.roles || group.roles.includes(role)).map((group, index) => (
     <div key={index} className="mb-8">
      <h4 className="text-xs font-bold text-slate-400 mb-4 px-2 ">
       {group.name}
      </h4>
      <ul className="flex flex-col gap-1">
       {group.items.filter(item => !item.roles || item.roles.includes(role)).map((item, i) => {
        const active = location.pathname === item.to;
        return (
         <li key={i}>
          <Link 
           to={item.to} 
           className={`flex items-center gap-3 px-5 py-2.5 rounded-lg font-medium transition-all ${
            active ? 'bg-white text-black' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
           }`}
          >
           <item.icon className="w-5 h-5" />
           <span className="text-sm">{item.label}</span>
          </Link>
         </li>
        );
       })}
      </ul>
     </div>
    ))}
   </div>

   {/* Sidebar Footer */}
   <div className="p-4 border-t border-white/5">
    <button 
     onClick={signOut}
     className="w-full flex items-center gap-3 px-5 py-2.5 text-slate-500 font-medium hover:text-white hover:bg-slate-900 rounded-lg transition-all"
    >
     <LogOut className="w-5 h-5" />
     <span className="text-sm">Logout</span>
    </button>
   </div>
  </aside>
 );
}
