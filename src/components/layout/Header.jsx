import { Search, Bell, ChevronDown, Building2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function Header() {
  const { profile, perumahanList, selectedPerumahanId, switchPerumahan } = useAuth();

  return (
    <header className="fixed top-0 right-0 left-64 h-16 bg-white border-b border-slate-200 z-40 px-6">
      <div className="h-full flex items-center justify-between">
        {/* Left Side: Search or Switcher */}
        <div className="flex items-center gap-4">
          {profile?.role === 'super_admin' && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-lg">
              <Building2 className="w-4 h-4 text-indigo-600" />
              <select 
                className="bg-transparent text-xs font-bold text-indigo-900 focus:outline-none cursor-pointer"
                value={selectedPerumahanId || ""}
                onChange={(e) => switchPerumahan(e.target.value)}
              >
                <option value="" disabled>Pilih Perumahan...</option>
                {perumahanList.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.nama} {item.status === 'suspended' ? '(Suspended)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="relative w-64 md:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-sm placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-600 transition-all"
              placeholder="Search anything..."
            />
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-6">
          <button className="relative p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-full transition-all">
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 border-2 border-white rounded-full"></span>
          </button>

          <div className="h-6 w-px bg-slate-200"></div>

          {/* User Profile */}
          <button className="flex items-center gap-3 px-2 py-1 hover:bg-slate-50 rounded-lg transition-all group text-left">
            <div className="w-9 h-9 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {profile?.nama?.charAt(0) || "U"}
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-semibold text-slate-900 leading-tight">{profile?.nama || "Admin"}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{profile?.role?.replace('_', ' ')}</p>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-400 group-hover:rotate-180 transition-all" />
          </button>
        </div>
      </div>
    </header>
  );
}
