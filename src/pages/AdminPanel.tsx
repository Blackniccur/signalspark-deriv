import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { UserPlus, Users, Shield, ArrowLeft, AlertCircle, CheckCircle, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ClientProfile {
  id: string;
  email: string;
  display_name: string | null;
  is_active: boolean;
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

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate("/login");
    }
  }, [user, isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (isAdmin) fetchClients();
  }, [isAdmin]);

  const fetchClients = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setClients(data as ClientProfile[]);
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setCreating(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
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
              <p className="text-muted-foreground text-xs">Manage client accounts</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={signOut} className="border-destructive/30 text-destructive hover:bg-destructive/10">
            Sign Out
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
                <Input
                  type="email"
                  placeholder="client@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-background/50 border-primary/20"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label className="text-primary text-[10px] font-orbitron uppercase tracking-widest">Password</Label>
                <Input
                  type="text"
                  placeholder="Strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-background/50 border-primary/20"
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-primary text-[10px] font-orbitron uppercase tracking-widest">Display Name</Label>
                <Input
                  type="text"
                  placeholder="Client name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="bg-background/50 border-primary/20"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded-lg border border-destructive/20">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 text-neon-green text-sm bg-neon-green/10 p-3 rounded-lg border border-neon-green/20">
                <CheckCircle className="h-4 w-4 shrink-0" />
                {success}
              </div>
            )}

            <Button
              type="submit"
              disabled={creating}
              className="bg-gradient-to-r from-primary/80 to-accent/60 hover:from-primary hover:to-accent text-background font-orbitron font-bold tracking-wider border border-primary/30"
            >
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
              {clients.map((client) => (
                <div
                  key={client.id}
                  className="flex items-center justify-between bg-background/30 rounded-lg p-4 border border-white/5"
                >
                  <div>
                    <p className="text-foreground font-medium text-sm">
                      {client.display_name || client.email}
                    </p>
                    <p className="text-muted-foreground text-xs">{client.email}</p>
                    <p className="text-muted-foreground text-[10px] mt-1">
                      {new Date(client.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-orbitron px-2 py-1 rounded ${
                        client.is_active
                          ? "bg-neon-green/10 text-neon-green border border-neon-green/20"
                          : "bg-destructive/10 text-destructive border border-destructive/20"
                      }`}
                    >
                      {client.is_active ? "ACTIVE" : "INACTIVE"}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleActive(client.id, client.is_active)}
                      className={client.is_active ? "text-destructive hover:bg-destructive/10" : "text-neon-green hover:bg-neon-green/10"}
                    >
                      {client.is_active ? "Deactivate" : "Activate"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
