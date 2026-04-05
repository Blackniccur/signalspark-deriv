import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { UserPlus, Users, Shield, ArrowLeft, AlertCircle, CheckCircle, Smartphone, Trash2, Settings, Phone, Wallet, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ClientProfile {
  id: string;
  email: string;
  display_name: string | null;
  is_active: boolean;
  created_at: string;
}

interface DeviceSession {
  id: string;
  user_id: string;
  device_fingerprint: string;
  device_name: string | null;
  last_active_at: string;
  created_at: string;
}

const AdminPanel = () => {
  const { user, isAdmin, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [deviceSessions, setDeviceSessions] = useState<Record<string, DeviceSession[]>>({});
  const [expandedClient, setExpandedClient] = useState<string | null>(null);

  // Settings state
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentAddress, setPaymentAddress] = useState("");
  const [paymentPrice, setPaymentPrice] = useState("");
  const [adminPhone, setAdminPhone] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate("/login");
    }
  }, [user, isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchClients();
      fetchAllDeviceSessions();
      fetchSettings();
    }
  }, [isAdmin]);

  const fetchSettings = async () => {
    const { data } = await supabase.from("app_settings").select("*");
    if (data) {
      data.forEach((s: any) => {
        if (s.key === "payment_method") setPaymentMethod(s.value);
        if (s.key === "payment_address") setPaymentAddress(s.value);
        if (s.key === "payment_price") setPaymentPrice(s.value);
        if (s.key === "admin_phone") setAdminPhone(s.value);
        if (s.key === "payment_note") setPaymentNote(s.value);
      });
    }
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    const settings = [
      { key: "payment_method", value: paymentMethod },
      { key: "payment_address", value: paymentAddress },
      { key: "payment_price", value: paymentPrice },
      { key: "admin_phone", value: adminPhone },
      { key: "payment_note", value: paymentNote },
    ];
    for (const s of settings) {
      await supabase.from("app_settings").update({ value: s.value, updated_at: new Date().toISOString() }).eq("key", s.key);
    }
    setSavingSettings(false);
    toast({ title: "Settings Saved", description: "Payment and contact info updated." });
  };

  const fetchClients = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setClients(data as ClientProfile[]);
  };

  const fetchAllDeviceSessions = async () => {
    const { data } = await supabase
      .from("device_sessions")
      .select("*")
      .order("last_active_at", { ascending: false });
    if (data) {
      const grouped: Record<string, DeviceSession[]> = {};
      (data as DeviceSession[]).forEach(session => {
        if (!grouped[session.user_id]) grouped[session.user_id] = [];
        grouped[session.user_id].push(session);
      });
      setDeviceSessions(grouped);
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setCreating(true);

    try {
      const res = await supabase.functions.invoke("create-client", {
        body: { email, password, displayName },
      });

      if (res.error) {
        setError(res.error.message);
      } else if (res.data?.error) {
        setError(res.data.error);
      } else {
        setSuccess(`Client ${email} created successfully!`);
        setEmail("");
        setPassword("");
        setDisplayName("");
        fetchClients();
        toast({ title: "Client Created", description: `Account for ${email} is ready.` });
      }
    } catch (err: any) {
      setError(err.message);
    }
    setCreating(false);
  };

  const toggleActive = async (clientId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("profiles")
      .update({ is_active: !currentStatus })
      .eq("id", clientId);
    if (!error) {
      fetchClients();
      toast({
        title: currentStatus ? "Client Deactivated" : "Client Activated",
        description: currentStatus ? "Client can no longer access the dashboard." : "Client can now access the dashboard.",
      });
    }
  };

  const deleteUser = async (clientId: string, clientEmail: string) => {
    if (!confirm(`Delete user ${clientEmail}? This will remove their profile, roles, and device sessions permanently.`)) return;
    
    // Delete device sessions, roles, profile (cascading)
    await supabase.from("device_sessions").delete().eq("user_id", clientId);
    await supabase.from("user_roles").delete().eq("user_id", clientId);
    await supabase.from("profiles").delete().eq("id", clientId);
    
    fetchClients();
    fetchAllDeviceSessions();
    toast({ title: "User Deleted", description: `${clientEmail} has been removed.` });
  };

  const clearDeviceSession = async (sessionId: string, userId: string) => {
    const { error } = await supabase
      .from("device_sessions")
      .delete()
      .eq("id", sessionId);
    if (!error) {
      fetchAllDeviceSessions();
      toast({ title: "Device Removed", description: "Device session cleared successfully." });
    }
  };

  const clearAllDeviceSessions = async (userId: string) => {
    const { error } = await supabase
      .from("device_sessions")
      .delete()
      .eq("user_id", userId);
    if (!error) {
      fetchAllDeviceSessions();
      toast({ title: "All Devices Cleared", description: "All device sessions removed for this user." });
    }
  };

  const getTimeSince = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-primary font-orbitron animate-pulse">LOADING...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background bg-grid-pattern">
      <div className="container mx-auto px-4 py-8 max-w-4xl relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-orbitron text-2xl font-bold text-primary tracking-wider flex items-center gap-2">
                <Shield className="h-6 w-6" /> ADMIN PANEL
              </h1>
              <p className="text-muted-foreground text-xs">Manage clients, payments & settings</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={signOut} className="border-destructive/30 text-destructive hover:bg-destructive/10">
            Sign Out
          </Button>
        </div>

        {/* Payment & Contact Settings */}
        <div className="glass-panel rounded-2xl p-6 glow-pink mb-8">
          <div className="flex items-center gap-2 mb-5">
            <Settings className="h-5 w-5 text-accent" />
            <h2 className="font-orbitron text-sm text-accent font-bold tracking-wider">PAYMENT & CONTACT SETTINGS</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-1">
              <Label className="text-accent text-[10px] font-orbitron uppercase tracking-widest">Payment Method</Label>
              <Input value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="bg-background/50 border-accent/20" placeholder="e.g. Binance (USDT TRC20)" />
            </div>
            <div className="space-y-1">
              <Label className="text-accent text-[10px] font-orbitron uppercase tracking-widest">Price</Label>
              <Input value={paymentPrice} onChange={(e) => setPaymentPrice(e.target.value)} className="bg-background/50 border-accent/20" placeholder="e.g. $60" />
            </div>
          </div>

          <div className="space-y-4 mb-4">
            <div className="space-y-1">
              <Label className="text-accent text-[10px] font-orbitron uppercase tracking-widest flex items-center gap-1"><Wallet className="h-3 w-3" /> Wallet Address</Label>
              <Input value={paymentAddress} onChange={(e) => setPaymentAddress(e.target.value)} className="bg-background/50 border-accent/20 font-mono text-xs" placeholder="Wallet address" />
            </div>
            <div className="space-y-1">
              <Label className="text-accent text-[10px] font-orbitron uppercase tracking-widest flex items-center gap-1"><Phone className="h-3 w-3" /> Admin Phone Number</Label>
              <Input value={adminPhone} onChange={(e) => setAdminPhone(e.target.value)} className="bg-background/50 border-accent/20" placeholder="+1 234 567 8900" />
            </div>
            <div className="space-y-1">
              <Label className="text-accent text-[10px] font-orbitron uppercase tracking-widest">Payment Note</Label>
              <Input value={paymentNote} onChange={(e) => setPaymentNote(e.target.value)} className="bg-background/50 border-accent/20" placeholder="Instructions for clients" />
            </div>
          </div>

          <Button onClick={saveSettings} disabled={savingSettings} className="bg-gradient-to-r from-accent/80 to-primary/60 hover:from-accent hover:to-primary text-background font-orbitron font-bold tracking-wider border border-accent/30 gap-2">
            <Save className="h-4 w-4" />
            {savingSettings ? "SAVING..." : "SAVE SETTINGS"}
          </Button>
        </div>

        {/* Create Client Form */}
        <div className="glass-panel rounded-2xl p-6 glow-cyan mb-8">
          <div className="flex items-center gap-2 mb-5">
            <UserPlus className="h-5 w-5 text-primary" />
            <h2 className="font-orbitron text-sm text-primary font-bold tracking-wider">CREATE CLIENT ACCOUNT</h2>
          </div>

          <form onSubmit={handleCreateClient} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label className="text-primary text-[10px] font-orbitron uppercase tracking-widest">Email</Label>
                <Input type="email" placeholder="client@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-background/50 border-primary/20" required />
              </div>
              <div className="space-y-1">
                <Label className="text-primary text-[10px] font-orbitron uppercase tracking-widest">Password</Label>
                <Input type="text" placeholder="Strong password" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-background/50 border-primary/20" required minLength={6} />
              </div>
              <div className="space-y-1">
                <Label className="text-primary text-[10px] font-orbitron uppercase tracking-widest">Display Name</Label>
                <Input type="text" placeholder="Client name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="bg-background/50 border-primary/20" />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded-lg border border-destructive/20">
                <AlertCircle className="h-4 w-4 shrink-0" /> {error}
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 text-neon-green text-sm bg-neon-green/10 p-3 rounded-lg border border-neon-green/20">
                <CheckCircle className="h-4 w-4 shrink-0" /> {success}
              </div>
            )}

            <Button type="submit" disabled={creating} className="bg-gradient-to-r from-primary/80 to-accent/60 hover:from-primary hover:to-accent text-background font-orbitron font-bold tracking-wider border border-primary/30">
              {creating ? "CREATING..." : "CREATE CLIENT"}
            </Button>
          </form>
        </div>

        {/* Client List */}
        <div className="glass-panel rounded-2xl p-6 glow-pink">
          <div className="flex items-center gap-2 mb-5">
            <Users className="h-5 w-5 text-accent" />
            <h2 className="font-orbitron text-sm text-accent font-bold tracking-wider">CLIENTS ({clients.length})</h2>
          </div>

          {clients.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No clients yet</p>
          ) : (
            <div className="space-y-3">
              {clients.map((client) => {
                const sessions = deviceSessions[client.id] || [];
                const isExpanded = expandedClient === client.id;

                return (
                  <div key={client.id} className="bg-background/30 rounded-lg border border-white/5 overflow-hidden">
                    <div className="flex items-center justify-between p-4">
                      <div className="flex-1">
                        <p className="text-foreground font-medium text-sm">
                          {client.display_name || client.email}
                        </p>
                        <p className="text-muted-foreground text-xs">{client.email}</p>
                        <p className="text-muted-foreground text-[10px] mt-1">
                          {new Date(client.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setExpandedClient(isExpanded ? null : client.id)}
                          className={`flex items-center gap-1 text-[10px] font-orbitron px-2 py-1 rounded border transition-colors ${
                            sessions.length > 0
                              ? "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20"
                              : "bg-muted/10 text-muted-foreground border-muted/30"
                          }`}
                        >
                          <Smartphone className="h-3 w-3" />
                          {sessions.length}/3
                        </button>
                        <span className={`text-[10px] font-orbitron px-2 py-1 rounded ${
                          client.is_active
                            ? "bg-neon-green/10 text-neon-green border border-neon-green/20"
                            : "bg-destructive/10 text-destructive border border-destructive/20"
                        }`}>
                          {client.is_active ? "ACTIVE" : "INACTIVE"}
                        </span>
                        <Button variant="ghost" size="sm" onClick={() => toggleActive(client.id, client.is_active)}
                          className={client.is_active ? "text-destructive hover:bg-destructive/10" : "text-neon-green hover:bg-neon-green/10"}>
                          {client.is_active ? "Deactivate" : "Activate"}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteUser(client.id, client.email)}
                          className="text-destructive hover:bg-destructive/10 h-8 w-8">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Device Sessions Dropdown */}
                    {isExpanded && (
                      <div className="border-t border-white/5 p-4 bg-background/20">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-orbitron text-[10px] text-primary tracking-wider">DEVICE SESSIONS</h4>
                          {sessions.length > 0 && (
                            <Button variant="ghost" size="sm" onClick={() => clearAllDeviceSessions(client.id)}
                              className="text-destructive hover:bg-destructive/10 text-xs h-7 gap-1">
                              <Trash2 className="h-3 w-3" /> Clear All
                            </Button>
                          )}
                        </div>
                        {sessions.length === 0 ? (
                          <p className="text-muted-foreground text-xs text-center py-3">No active devices</p>
                        ) : (
                          <div className="space-y-2">
                            {sessions.map(session => (
                              <div key={session.id} className="flex items-center justify-between bg-background/40 rounded-md p-3 border border-white/5">
                                <div className="flex items-center gap-3">
                                  <Smartphone className="h-4 w-4 text-primary" />
                                  <div>
                                    <p className="text-foreground text-xs font-medium">{session.device_name || "Unknown"}</p>
                                    <p className="text-muted-foreground text-[10px]">
                                      Last active: {getTimeSince(session.last_active_at)}
                                    </p>
                                    <p className="text-muted-foreground text-[10px] font-mono">
                                      {session.device_fingerprint.slice(0, 8)}...
                                    </p>
                                  </div>
                                </div>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                  onClick={() => clearDeviceSession(session.id, client.id)}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
