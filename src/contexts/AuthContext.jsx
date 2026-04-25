/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPerumahanId, setSelectedPerumahanId] = useState(null);
  const [perumahanList, setPerumahanList] = useState([]);

  useEffect(() => {
    let mounted = true;

    // Emergency fallback... (keep existing)
    const emergencyTimer = setTimeout(() => {
      if (mounted && loading) {
        console.warn("Auth check timed out after 10 seconds! Forcing loading to false.");
        setLoading(false);
      }
    }, 10000);

    const fetchAllPerumahan = async () => {
      try {
        const { data, error } = await supabase.from('perumahan').select('*').order('nama');
        if (!error && mounted) setPerumahanList(data || []);
      } catch (err) {
        console.error("Error fetching all perumahan:", err);
      }
    };

    const fetchProfile = async (userId) => {
      try {
        console.log("Fetching profile for:", userId);
        const { data, error } = await supabase
          .from('warga')
          .select('*, perumahan(nama)')
          .eq('user_id', userId)
          .single();
        
        if (!error && data) {
          console.log("Profile loaded:", data.role);
          if (mounted) {
            setProfile(data);
            // Inisialisasi selectedPerumahanId dari profile jika belum ada
            setSelectedPerumahanId(prev => prev || data.perumahan_id);
            
            // Jika Super Admin, ambil semua daftar komplek
            if (data.role === 'super_admin') {
              fetchAllPerumahan();
            }
          }
        } else if (error) {
          console.error("Profile fetch error:", error.message);
          if (mounted) setProfile(null);
        }
      } catch (err) {
        console.error("Unexpected profile fetch error:", err);
        if (mounted) setProfile(null);
      }
    };

    const setData = async () => {
      try {
        console.log("Checking session...");
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (mounted) setUser(session?.user || null);
        
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          if (mounted) {
            setProfile(null);
            setSelectedPerumahanId(null);
          }
        }
      } catch (err) {
        console.error("Auth init error:", err);
      } finally {
        if (mounted) {
          setLoading(false);
          clearTimeout(emergencyTimer);
        }
      }
    };

    setData();

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      console.log("Auth state changed:", event);
      try {
        setUser(session?.user || null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
          setSelectedPerumahanId(null);
        }
      } catch (err) {
        console.error("Auth state change error:", err);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(emergencyTimer);
      listener?.subscription.unsubscribe();
    };
  }, []);

  const value = {
    user,
    profile,
    loading,
    selectedPerumahanId,
    perumahanList,
    switchPerumahan: (id) => setSelectedPerumahanId(id),
    signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
    signUp: (email, password, metadata) => supabase.auth.signUp({ email, password, options: { data: metadata } }),
    signOut: () => {
      setSelectedPerumahanId(null);
      return supabase.auth.signOut();
    },
    updateProfile: async (newData) => {
      if (!user) return { error: "No user logged in" };
      const { error } = await supabase
        .from('warga')
        .update(newData)
        .eq('user_id', user.id);
      
      if (!error) {
        // Refresh profil
        const { data } = await supabase
          .from('warga')
          .select('*, perumahan(nama)')
          .eq('user_id', user.id)
          .single();
        setProfile(data);
      }
      return { error };
    },
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
