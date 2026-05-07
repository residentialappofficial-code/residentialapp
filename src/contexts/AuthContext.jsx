/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
 const [user, setUser] = useState(null);
 const [profile, setProfile] = useState(null);
 const [loading, setLoading] = useState(true);
 const [selectedPerumahanId, setSelectedPerumahanId] = useState(null);
 const [perumahanList, setPerumahanList] = useState([]);
 const lastFetchedUserId = useRef(null);

 const fetchAllPerumahan = useCallback(async () => {
  try {
   const { data, error } = await supabase.from('perumahan').select('*').order('nama');
   if (!error) setPerumahanList(data || []);
  } catch (err) {
   console.error("Error fetching all perumahan:", err);
  }
 }, []);

 const fetchProfile = useCallback(async (userId) => {
  // Hindari fetch berulang untuk user yang sama dalam waktu singkat
  if (lastFetchedUserId.current === userId) {
   setLoading(false);
   return;
  }
  lastFetchedUserId.current = userId;

  try {
   console.time("fetchProfile");
   console.log("Fetching profile for:", userId);
   
   // Gunakan Promise.race untuk memberi batas waktu 5 detik
   const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error("Timeout")), 5000)
   );

   const fetchPromise = Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
    supabase.from('warga').select('*').eq('user_id', userId).maybeSingle()
   ]);

   try {
    const [profResult, wargaResult] = await Promise.race([fetchPromise, timeoutPromise]);
    
    const profData = profResult.data;
    const wargaData = wargaResult.data;

    if (profData) {
     console.log("  - Profile found in 'profiles':", profData.role);
     setProfile(profData);
     if (profData.role === 'super_admin') fetchAllPerumahan();
     else if (profData.perumahan_id) setSelectedPerumahanId(profData.perumahan_id);
    } else if (wargaData) {
     console.log("  - Profile found in 'warga'");
     const formattedProfile = { ...wargaData, role: 'resident' };
     setProfile(formattedProfile);
     if (wargaData.perumahan_id) setSelectedPerumahanId(wargaData.perumahan_id);
    } else {
     console.error("  - No profile found in any table for user:", userId);
     // VOID the Fast Track profile because it doesn't exist in DB
     setProfile(null);
     lastFetchedUserId.current = userId; 
    }

    if (profResult.error) console.warn("  - 'profiles' error:", profResult.error.message);
    if (wargaResult.error) console.warn("  - 'warga' error:", wargaResult.error.message);

   } catch (timeoutErr) {
    if (timeoutErr.message === "Timeout") {
     console.error("Profile fetch timed out after 5s.");
    } else {
     throw timeoutErr;
    }
    setProfile(null);
   }

  } catch (err) {
   console.error("Profile fetch error:", err);
   setProfile({ role: 'guest' });
  } finally {
   console.timeEnd("fetchProfile");
   setLoading(false);
  }
 }, [fetchAllPerumahan]);

 useEffect(() => {
  let mounted = true;

  // Gunakan onAuthStateChange untuk inisialisasi DAN perubahan state
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
   if (!mounted) return;
   
   console.log(`Auth Event: ${event}`);
   const currentUser = session?.user || null;
   setUser(currentUser);

   if (currentUser) {
    // FAST TRACK: Gunakan metadata dari session user dulu agar UI tidak hang
    console.log("  - Fast Track: Using user metadata");
    setProfile({
     role: currentUser.user_metadata?.role || 'resident',
     nama: currentUser.user_metadata?.nama || currentUser.email,
     perumahan_id: currentUser.user_metadata?.perumahan_id
    });

    if (currentUser.user_metadata?.perumahan_id) {
     setSelectedPerumahanId(currentUser.user_metadata.perumahan_id);
    }
    
    // Langsung matikan loading agar UI muncul
    setLoading(false);

    // Fetch profil lengkap dari DB di background untuk sinkronisasi data terbaru
    fetchProfile(currentUser.id);
   } else {
    setProfile(null);
    setSelectedPerumahanId(null);
    setLoading(false);
   }
  });

  return () => {
   mounted = false;
   subscription.unsubscribe();
  };
 }, [fetchProfile]);

 const value = {
  user,
  profile,
  role: profile?.role,
  loading,
  selectedPerumahanId,
  perumahanList,
  switchPerumahan: (id) => setSelectedPerumahanId(id),
  signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
  signUp: (email, password, metadata) => supabase.auth.signUp({ email, password, options: { data: metadata } }),
  signOut: async () => {
   setLoading(true);
   lastFetchedUserId.current = null;
   setSelectedPerumahanId(null);
   setProfile(null);
   const { error } = await supabase.auth.signOut();
   setLoading(false);
   return { error };
  },
  resetPassword: (email) => supabase.auth.resetPasswordForEmail(email, {
   redirectTo: `${window.location.origin}/reset-password`,
  }),
  updateProfile: async (newData) => {
   if (!user) return { error: "No user logged in" };
   const { error } = await supabase
    .from('warga')
    .update(newData)
    .eq('user_id', user.id);
   
   if (!error) {
    await fetchProfile(user.id);
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

export const useAuth = () => useContext(AuthContext);
