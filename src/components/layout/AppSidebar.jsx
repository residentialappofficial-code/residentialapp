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
      name: "Main Menu",
      items: [
        { icon: LayoutDashboard, label: "Dashboard", to: "/" },
        { icon: Building2, label: "All Complexes", to: "/manage-complexes", roles: ["super_admin"] },
        { icon: Building2, label: "My Complex", to: "/my-complex", roles: ["admin"] },
        { icon: Users, label: "Residents", to: "/warga" },
        { icon: Banknote, label: "Payments", to: "/iuran" },
        { icon: Settings, label: "Iuran Config", to: "/iuran-config", roles: ["admin"] },
        { icon: FileText, label: "Manage Bills", to: "/manage-bills", roles: ["admin"] },
        { icon: ShieldCheck, label: "Verify Payments", to: "/verify-payments", roles: ["admin"] },
        { icon: WalletCards, label: "Cashflow", to: "/kas" },
        { icon: Briefcase, label: "Payroll", to: "/penggajian" },
        { icon: MessageSquare, label: "Forum", to: "/forum" },
        { icon: Megaphone, label: "Announcements", to: "/announcements" },
        { icon: MessageSquareWarning, label: "Complaints", to: "/complaints" },
        { icon: Hammer, label: "Ketersediaan Aset", to: "/assets" },
        { icon: UserCog, label: "Staff", to: "/pengurus" },
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
    <aside className="fixed left-0 top-0 w-64 h-screen bg-slate-800 text-white flex flex-col z-50">
      {/* Sidebar Header */}
      <div className="px-6 py-8 flex items-center gap-3 border-b border-slate-700">
        <div className="bg-indigo-600 p-2 rounded-lg">
          <ShieldCheck className="w-6 h-6 text-white" />
        </div>
        <span className="font-bold text-xl tracking-tight">Habitix</span>
      </div>

      {/* Sidebar Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {menuGroups.map((group, index) => (
          <div key={index} className="mb-8">
            <h4 className="text-xs font-bold text-slate-400 mb-4 px-2 uppercase tracking-widest">
              {group.name}
            </h4>
            <ul className="flex flex-col gap-1">
              {group.items.filter(item => !item.roles || item.roles.includes(role)).map((item, i) => {
                const active = location.pathname === item.to;
                return (
                  <li key={i}>
                    <Link 
                      to={item.to} 
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                        active ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'
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
      <div className="p-4 border-t border-slate-700">
        <button 
          onClick={signOut}
          className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 font-medium hover:text-white hover:bg-slate-700 rounded-lg transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm">Logout</span>
        </button>
      </div>
    </aside>
  );
}
