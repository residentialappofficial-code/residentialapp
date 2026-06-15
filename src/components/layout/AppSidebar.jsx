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
  Hammer,
  LayoutGrid,
  Grid3X3,
  History,
  ArrowRight,
  X,
  Server,
  Activity,
  Landmark
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";

export function AppSidebar({ isOpen, onClose }) {
  const auth = useAuth();
  const signOut = auth?.signOut;
  const role = auth?.role;
  const profile = auth?.profile;
  
  const { can } = usePermissions();
  const location = useLocation();

  const menuGroups = [
    {
      name: "Menu Warga",
      items: [
        { icon: LayoutDashboard, label: "Dashboard", to: "/dashboard", roles: ["warga", "admin"], module: "dashboard" },
        { icon: Banknote, label: "Tagihan Saya", to: "/my-bills", roles: ["warga", "admin"], isFixed: true },
        { icon: Briefcase, label: "Pinjam Aset", to: "/borrow-assets", roles: ["warga", "admin"], module: "assets" },
        { icon: Megaphone, label: "Pengumuman", to: "/announcements", roles: ["warga", "admin"], module: "pengumuman" },
        { icon: MessageSquareWarning, label: "Laporan & Keluhan", to: "/complaints", roles: ["warga", "admin"], module: "keluhan" },
        { icon: MessageSquare, label: "Forum Warga", to: "/forum", roles: ["warga", "admin"], module: "forum" },
        { icon: User, label: "Profil Saya", to: "/profile", isFixed: true },
      ]
    },
    {
      name: "Operasional Admin",
      roles: ["admin", "super_admin"],
      items: [
        { icon: LayoutDashboard, label: "Dashboard Platform", to: "/dashboard", roles: ["super_admin"] },
        { icon: ShieldCheck, label: "Iuran Warga (Dashboard)", to: "/community-billing", module: "iuran" },
        { icon: Building2, label: "Profil Komplek", to: "/my-complex", roles: ["admin"], module: "profile_complex" },
        { icon: Building2, label: "Infrastruktur Global", to: "/manage-complexes", roles: ["super_admin"] },
        { icon: Server, label: "Sistem & Integrasi", to: "/system-settings", roles: ["super_admin"] },
        { icon: Activity, label: "Audit Trail", to: "/audit-logs", roles: ["admin", "super_admin"] },
        { icon: Landmark, label: "Pencairan Dana", to: "/super-admin/disbursements", roles: ["super_admin"] },
        { icon: Grid3X3, label: "Manajemen Blok", to: "/blok", roles: ["admin", "super_admin"], module: "blok" },
        { icon: Users, label: "Data Warga", to: "/warga", roles: ["admin", "super_admin"], module: "warga" },
        { icon: ShieldCheck, label: "Verifikasi Pembayaran", to: "/verify-payments", roles: ["admin", "super_admin"], module: "iuran" },
        { icon: FileText, label: "Kelola Tagihan", to: "/manage-bills", roles: ["admin", "super_admin"], module: "iuran" },
        { icon: Settings, label: "Konfigurasi Iuran", to: "/iuran-config", roles: ["admin", "super_admin"], module: "iuran" },
        { icon: WalletCards, label: "Catatan Kas", to: "/kas", roles: ["admin", "super_admin"], module: "kas" },
        { icon: Briefcase, label: "Sistem Penggajian", to: "/penggajian", roles: ["admin", "super_admin"], module: "penggajian" },
        { icon: UserCog, label: "Struktur Pengurus", to: "/pengurus", roles: ["admin", "super_admin"], module: "pengurus" },
        { icon: Hammer, label: "Manajemen Aset", to: "/assets", roles: ["admin", "super_admin"], module: "assets" },
        { icon: ShieldCheck, label: "Hak Akses", to: "/roles", roles: ["admin", "super_admin"] },
        { icon: Megaphone, label: "Moderasi Pengumuman", to: "/announcements", roles: ["super_admin"] },
        { icon: MessageSquareWarning, label: "Moderasi Keluhan", to: "/complaints", roles: ["super_admin"] },
        { icon: MessageSquare, label: "Moderasi Forum", to: "/forum", roles: ["super_admin"] },
        { icon: WalletCards, label: "Langganan Habitix", to: "/subscription", roles: ["admin"], isFixed: true },
        { icon: WalletCards, label: "Kelola Langganan", to: "/super-admin/subscriptions", roles: ["super_admin"] },
      ]
    }
  ];

  const isSuspended = auth?.isSuspended;

  return (
    <>
      {/* Mobile Sidebar Overlay Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 lg:hidden transition-all duration-300"
        />
      )}

      <aside className={`
        fixed left-0 top-0 w-64 h-screen bg-white text-slate-600 flex flex-col z-50 border-r border-slate-100 transition-transform duration-300 ease-in-out
        lg:translate-x-0 
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Sidebar Header */}
        <div className="p-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg text-slate-900 tracking-tighter leading-none">HABITIX</span>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="lg:hidden p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

      {/* Sidebar Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6 scrollbar-hide">
        {menuGroups.filter(group => {
          const hasAccessibleItem = group.items.some(item => {
            const isPengurus = !!profile?.pengurus;
            const roleMatch = !item.roles || item.roles.includes(role) || (isPengurus && item.roles?.includes('admin'));
            
            if (!roleMatch) return false;
            if (isSuspended && !item.isFixed) return false;
            if (item.isFixed) return true;
            if (item.module) return can(item.module, 'view');
            return true;
          });
          return hasAccessibleItem;
        }).map((group, groupIdx) => (
          <div key={groupIdx} className="mb-6 last:mb-0">
            <h4 className="px-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">{group.name}</h4>
            <div className="space-y-0.5">
              {group.items.filter(item => {
                const isPengurus = !!profile?.pengurus;
                const roleMatch = !item.roles || item.roles.includes(role) || (isPengurus && item.roles?.includes('admin'));
                
                if (!roleMatch) return false;
                if (isSuspended && !item.isFixed) return false;
                if (item.isFixed) return true;
                if (item.module) return can(item.module, 'view');
                return true;
              }).map((item, itemIdx) => {
                const isActive = location.pathname === item.to;
                const Icon = item.icon;
                
                return (
                  <Link
                    key={itemIdx}
                    to={item.to}
                    onClick={() => { if (window.innerWidth < 1024) onClose(); }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      isActive 
                        ? 'bg-indigo-50 text-indigo-600' 
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Icon size={18} className={isActive ? 'text-indigo-600' : 'text-slate-400'} />
                    <span className={`text-sm font-medium ${isActive ? 'font-semibold' : ''}`}>
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Sidebar Footer */}
      <div className="p-6 mt-auto border-t border-slate-50 flex flex-col gap-4">
        <Link 
          to="/changelog" 
          onClick={() => { if (window.innerWidth < 1024) onClose(); }}
          className="flex items-center justify-between px-4 py-2 rounded-lg hover:bg-slate-50 transition-all group"
        >
          <div className="flex items-center gap-2">
            <History size={14} className="text-slate-400 group-hover:text-indigo-600" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-slate-900">Versi 3.0.3</span>
          </div>
          <ArrowRight size={10} className="text-slate-300 group-hover:text-slate-900 opacity-0 group-hover:opacity-100 transition-all" />
        </Link>
        <button 
          onClick={signOut}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 text-white hover:bg-black transition-all text-sm font-medium shadow-lg shadow-slate-100"
        >
          <LogOut size={16} />
          Keluar
        </button>
      </div>
    </aside>
    </>
  );
}
