/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Emergency fallback to prevent infinite loading state
    const emergencyTimer = setTimeout(() => {
      if (mounted && loading) {
        console.warn("Auth check timed out after 10 seconds! Forcing loading to false.");
        setLoading(false);
      }
    }, 10000);

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
          if (mounted) setProfile(data);
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
        if (error) {
           console.error("Session fetch error:", error.message);
           throw error;
        }
        
        if (mounted) setUser(session?.user || null);
        
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          if (mounted) setProfile(null);
        }
      } catch (err) {
        console.error("Auth init error:", err);
      } finally {
        if (mounted) {
          console.log("Auth init finished, setting loading to false.");
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
          // We intentionally do not use setLoading(true) here to prevent disrupting user experience mid-flight
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
      } catch (err) {
        console.error("Auth state change error:", err);
      } finally {
        if (mounted) {
          setLoading(false);
          clearTimeout(emergencyTimer);
        }
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
    signOut: () => supabase.auth.signOut(),
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
