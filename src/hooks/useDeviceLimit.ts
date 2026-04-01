import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const MAX_DEVICES = 3;

function getDeviceFingerprint(): string {
  const stored = localStorage.getItem("device_fingerprint");
  if (stored) return stored;
  
  const fp = crypto.randomUUID();
  localStorage.setItem("device_fingerprint", fp);
  return fp;
}

function getDeviceName(): string {
  const ua = navigator.userAgent;
  if (/Mobile|Android|iPhone/i.test(ua)) return "Mobile";
  if (/Tablet|iPad/i.test(ua)) return "Tablet";
  return "Desktop";
}

export function useDeviceLimit(userId: string | undefined) {
  const [blocked, setBlocked] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!userId) {
      setChecking(false);
      return;
    }

    const checkDevice = async () => {
      const fingerprint = getDeviceFingerprint();
      const deviceName = getDeviceName();

      // Try to upsert this device session
      const { error: upsertError } = await supabase
        .from("device_sessions")
        .upsert(
          { user_id: userId, device_fingerprint: fingerprint, device_name: deviceName, last_active_at: new Date().toISOString() },
          { onConflict: "user_id,device_fingerprint" }
        );

      if (upsertError) {
        console.error("Device upsert error:", upsertError);
      }

      // Count active sessions for this user
      const { data: sessions } = await supabase
        .from("device_sessions")
        .select("id, device_fingerprint, last_active_at")
        .eq("user_id", userId)
        .order("last_active_at", { ascending: false });

      if (sessions && sessions.length > MAX_DEVICES) {
        // Check if current device is in the top 3
        const topDevices = sessions.slice(0, MAX_DEVICES);
        const isAllowed = topDevices.some(s => s.device_fingerprint === fingerprint);
        
        if (!isAllowed) {
          setBlocked(true);
          await supabase.auth.signOut();
        } else {
          // Clean up old sessions
          const oldIds = sessions.slice(MAX_DEVICES).map(s => s.id);
          await supabase.from("device_sessions").delete().in("id", oldIds);
        }
      }

      setChecking(false);
    };

    checkDevice();

    // Heartbeat every 60s
    const interval = setInterval(async () => {
      const fingerprint = getDeviceFingerprint();
      await supabase
        .from("device_sessions")
        .update({ last_active_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("device_fingerprint", fingerprint);
    }, 60000);

    return () => clearInterval(interval);
  }, [userId]);

  return { blocked, checking };
}
