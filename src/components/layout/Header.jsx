import { Search, Bell, ChevronDown, Building2, Sparkles, Menu } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function Header({ onMenuClick }) {
  const { profile, perumahanList, selectedPerumahanId, switchPerumahan } = useAuth();

  return (
    <header className="fixed top-0 right-0 lg:left-64 left-0 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 z-40 px-4 md:px-6">
      <div className="h-full flex items-center justify-between">
        {/* Left Side: Search or Switcher */}
        <div className="flex items-center gap-3 md:gap-4">
          <button 
            onClick={onMenuClick}
            className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer mr-1"
          >
            <Menu className="w-5 h-5" />
          </button>
          {profile?.role === 'super_admin' && (
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg">
              <Building2 className="w-3.5 h-3.5" />
              <select 
                className="bg-transparent text-[11px] font-bold focus:outline-none cursor-pointer"
                value={selectedPerumahanId || ""}
                onChange={(e) => switchPerumahan(e.target.value)}
              >
                <option value="" disabled className="text-slate-950">Select Infrastructure</option>
                {perumahanList.map(item => (
                  <option key={item.id} value={item.id} className="text-slate-950">
                    {item.nama}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="relative w-64 md:w-80 group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-sm placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all"
              placeholder="Search..."
            />
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium">
            1D <Sparkles className="w-4 h-4 ml-1 text-slate-400" />
          </div>

          <button className="relative p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all border border-slate-200">
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 border-2 border-white rounded-full"></span>
          </button>

          {/* User Profile */}
          <button className="flex items-center gap-2 pl-2 pr-3 py-1.5 hover:bg-slate-50 rounded-full transition-all border border-slate-200">
            <div className="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
              {profile?.nama?.charAt(0) || "U"}
            </div>
            <div className="hidden md:flex items-center gap-2">
              <p className="text-sm font-semibold text-slate-700 leading-none">{profile?.nama?.split(' ')[0] || "Admin"}</p>
              <div className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[10px] font-bold">
                {profile?.role === 'super_admin' ? 'Pro' : 'User'}
              </div>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-400 ml-1" />
          </button>
        </div>
      </div>
    </header>
  );
}
