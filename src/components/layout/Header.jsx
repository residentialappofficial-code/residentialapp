import { useState, useEffect, useCallback } from "react";
import { Search, Bell, ChevronDown, Building2, Sparkles, Menu, Check, Trash2, MailOpen } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

export function Header({ onMenuClick }) {
  const { profile, user, perumahanList, selectedPerumahanId, switchPerumahan } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);

  const fetchNotifications = useCallback(async () => {
    const uid = user?.id || profile?.id;
    if (!uid) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!error) {
        setNotifications(data || []);
        // Hitung unread count dari DB langsung untuk akurasi
        const { count, error: countError } = await supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', uid)
          .eq('is_read', false);
        if (!countError) setUnreadCount(count || 0);
      }
    } catch (err) {
      console.error("Gagal memuat notifikasi:", err);
    }
  }, [profile, user]);

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchNotifications();
    });

    const uid = user?.id || profile?.id;
    if (!uid) return;

    // Supabase Realtime subscription
    const channel = supabase
      .channel(`user-notifications-${uid}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${uid}`
        },
        (payload) => {
          setNotifications(prev => [payload.new, ...prev.slice(0, 9)]);
          setUnreadCount(c => c + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile, user, fetchNotifications]);

  const markAllAsRead = async () => {
    const uid = user?.id || profile?.id;
    if (!uid) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', uid)
        .eq('is_read', false);

      if (!error) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("Gagal menandai semua dibaca:", err);
    }
  };

  const markAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (!error) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        setUnreadCount(c => Math.max(0, c - 1));
      }
    } catch (err) {
      console.error("Gagal menandai notifikasi dibaca:", err);
    }
  };

  const deleteNotification = async (id, e) => {
    e.stopPropagation();
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (!error) {
        setNotifications(prev => prev.filter(n => n.id !== id));
        // Refresh unread count
        fetchNotifications();
      }
    } catch (err) {
      console.error("Gagal menghapus notifikasi:", err);
    }
  };

  const getIconColor = (type) => {
    switch (type) {
      case 'billing': return 'text-rose-500 bg-rose-50';
      case 'complaint': return 'text-amber-500 bg-amber-50';
      case 'announcement': return 'text-indigo-500 bg-indigo-50';
      default: return 'text-slate-500 bg-slate-50';
    }
  };

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

          <div className="hidden md:block relative w-64 md:w-80 group">
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

          {/* Notification Bell Dropdown Container */}
          <div className="relative">
            <button 
              onClick={() => setShowDropdown(prev => !prev)}
              className={`relative p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all border border-slate-200 cursor-pointer ${showDropdown ? 'bg-slate-50 text-slate-950' : ''}`}
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 border-2 border-white rounded-full text-[9px] font-black text-white flex items-center justify-center px-0.5">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Dropdown Panel */}
            {showDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden transform origin-top-right transition-all">
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Notifikasi</span>
                      {unreadCount > 0 && (
                        <span className="bg-red-100 text-red-600 text-[9px] font-black px-1.5 py-0.5 rounded-full">
                          {unreadCount} Baru
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button 
                        onClick={markAllAsRead}
                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                      >
                        <MailOpen className="w-3 h-3" /> Tandai Semua Dibaca
                      </button>
                    )}
                  </div>

                  <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-100 custom-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-xs font-semibold">
                        Tidak ada notifikasi.
                      </div>
                    ) : (
                      notifications.map(item => (
                        <div 
                          key={item.id} 
                          className={`p-4 hover:bg-slate-50/70 transition-colors flex items-start gap-3 relative group ${!item.is_read ? 'bg-indigo-50/20' : ''}`}
                        >
                          <div className={`p-2 rounded-xl shrink-0 ${getIconColor(item.type)}`}>
                            <Bell className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0 pr-6">
                            <p className="text-xs font-bold text-slate-800 truncate">{item.title}</p>
                            <p className="text-[11px] font-medium text-slate-500 mt-0.5 leading-relaxed">{item.message}</p>
                            <p className="text-[9px] font-medium text-slate-400 mt-1">
                              {new Date(item.created_at).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          
                          {/* Item Actions */}
                          <div className="absolute right-3 top-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!item.is_read && (
                              <button 
                                onClick={(e) => markAsRead(item.id, e)}
                                className="p-1 text-slate-400 hover:text-green-600 hover:bg-slate-100 rounded-md cursor-pointer"
                                title="Tandai dibaca"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button 
                              onClick={(e) => deleteNotification(item.id, e)}
                              className="p-1 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-md cursor-pointer"
                              title="Hapus"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {!item.is_read && (
                            <span className="absolute right-3 top-4 w-2 h-2 bg-indigo-600 rounded-full group-hover:hidden" />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* User Profile */}
          <button className="flex items-center gap-2 pl-2 pr-3 py-1.5 hover:bg-slate-50 rounded-full transition-all border border-slate-200">
            <div className="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
              {profile?.nama?.charAt(0) || "U"}
            </div>
            <div className="hidden md:flex items-center gap-2">
              <p className="text-sm font-semibold text-slate-700 leading-none">{profile?.nama?.split(' ')[0] || "Admin"}</p>
              <div className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[10px] font-bold">
                {profile?.role === 'super_admin' ? 'Super Admin' : (profile?.role === 'admin' ? 'Admin' : 'Warga')}
              </div>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-400 ml-1" />
          </button>
        </div>
      </div>
    </header>
  );
}
