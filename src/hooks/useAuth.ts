import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(true);

  const fetchUserDetails = (currentUser: User) => {
    // Don't await - fire and forget to avoid blocking auth state changes
    Promise.all([
      supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", currentUser.id),
      supabase
        .from("profiles")
        .select("is_active")
        .eq("id", currentUser.id)
        .single(),
    ]).then(([{ data: roleData }, { data: profile }]) => {
      setIsAdmin(roleData?.some((r: any) => r.role === "admin") ?? false);
      setIsActive(profile?.is_active ?? false);
      setLoading(false);
    }).catch((err) => {
      console.error("Error fetching user details:", err);
      setLoading(false);
    });
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchUserDetails(currentUser);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes - DO NOT use async callback
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          fetchUserDetails(currentUser);
        } else {
          setIsAdmin(false);
          setIsActive(true);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { user, isAdmin, isActive, loading, signIn, signOut };
}
