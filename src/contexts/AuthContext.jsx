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

    const fetchPromise = (async () => {
      const { data: profData, error: profError } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      
      let { data: wargaData, error: wargaError } = await supabase.from('warga').select('*').eq('user_id', userId).maybeSingle();
      
      if (wargaError && (wargaError.code === 'PGRST104' || wargaError.status === 400)) {
        console.warn("  - Error 400 on 'warga' fetch. Trying email fallback...");
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser?.email) {
          const { data: fData } = await supabase.from('warga').select('*').eq('email', authUser.email).maybeSingle();
          if (fData) {
            wargaData = fData;
            wargaError = null;
          }
        }
      }
      
      let pengurusData = null;
      if (wargaData?.id) {
        const { data: pData, error: pError } = await supabase.from('pengurus')
          .select('*, role:role_id(*)')
          .eq('warga_id', wargaData.id)
          .maybeSingle();
        pengurusData = pData;
        if (pError) console.warn("  - 'pengurus' error:", pError.message);
      }

      return { profData, wargaData, pengurusData, profError, wargaError };
    })();

    try {
      const { profData, wargaData, pengurusData, profError, wargaError } = await Promise.race([fetchPromise, timeoutPromise]);
      
      let normalizedRole = 'warga';
      let perumahanId = null;
      let finalProfile = null;

      if (profData) {
        normalizedRole = profData.role === 'resident' ? 'warga' : profData.role;
        perumahanId = profData.perumahan_id;
        finalProfile = { 
          ...profData, 
          role: normalizedRole,
          warga_id: wargaData?.id // If they are also in warga table
        };
      } else if (wargaData) {
        normalizedRole = 'warga';
        perumahanId = wargaData.perumahan_id;
        finalProfile = { 
          ...wargaData, 
          id: user.id, // Ensure profile.id is Auth ID
          warga_id: wargaData.id, // Store Warga Record ID
          role: normalizedRole 
        };
      }

      if (finalProfile) {
        console.log(`  - Profile found as ${normalizedRole}`);
        
        // Fetch permissions if it's a regular warga (not super_admin/admin who get 'all' in hook)
        let rolePermissions = {};
        if (normalizedRole === 'warga' && perumahanId) {
          const { data: roleData } = await supabase
            .from('perumahan_roles')
            .select('*')
            .eq('perumahan_id', perumahanId)
            .ilike('name', 'warga')
            .maybeSingle();
          
          if (roleData) {
            rolePermissions = roleData.permissions || {};
          }
        }

        setProfile({ 
          ...finalProfile, 
          pengurus: pengurusData,
          permissions: rolePermissions 
        });

        if (normalizedRole === 'super_admin') fetchAllPerumahan();
        if (perumahanId) setSelectedPerumahanId(perumahanId);
      } else {
        console.error("  - No profile found in any table for user:", userId);
        setProfile(null);
        lastFetchedUserId.current = userId; 
      }

      if (profError) console.warn("  - 'profiles' error:", profError.message);
      if (wargaError) console.warn("  - 'warga' error:", wargaError.message);

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
     role: currentUser.user_metadata?.role === 'resident' ? 'warga' : (currentUser.user_metadata?.role || 'warga'),
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
