import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Mail, AlertCircle, Wallet } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error.message);
        setLoading(false);
      } else {
        // Small delay to let auth state propagate
        setTimeout(() => navigate("/"), 500);
      }
    } catch (err: any) {
      setError(err?.message || "Login failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background bg-grid-pattern flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="font-orbitron text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary tracking-wider">
            DERIV SIGNAL PRO
          </h1>
          <p className="text-muted-foreground text-sm mt-2 tracking-widest uppercase">
            Richkiddollar Hunterbot
          </p>
        </div>

        {/* Login Form */}
        <div className="glass-panel rounded-2xl p-8 glow-cyan">
          <h2 className="font-orbitron text-lg text-primary font-bold mb-6 text-center tracking-wider">
            LOGIN
          </h2>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-primary text-xs font-orbitron uppercase tracking-widest">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-background/50 border-primary/20 text-foreground placeholder:text-muted-foreground"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-primary text-xs font-orbitron uppercase tracking-widest">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-background/50 border-primary/20 text-foreground placeholder:text-muted-foreground"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded-lg border border-destructive/20">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary/80 to-accent/60 hover:from-primary hover:to-accent text-background font-orbitron font-bold tracking-wider border border-primary/30 shadow-lg shadow-primary/20"
            >
              {loading ? "AUTHENTICATING..." : "SIGN IN"}
            </Button>
          </form>
        </div>

        {/* Payment Info */}
        <div className="glass-panel rounded-2xl p-6 glow-pink">
          <div className="flex items-center gap-2 mb-3">
            <Wallet className="h-5 w-5 text-accent" />
            <h3 className="font-orbitron text-sm text-accent font-bold tracking-wider">GET ACCESS - $60</h3>
          </div>
          <p className="text-muted-foreground text-sm mb-3">
            Pay via Binance (USDT TRC20) to get your login credentials:
          </p>
          <div className="bg-background/50 rounded-lg p-3 border border-accent/20">
            <p className="text-xs text-muted-foreground mb-1 font-orbitron">USDT Address (TRC20):</p>
            <p className="text-accent text-xs font-mono break-all select-all">
              TP8JxB5qcXDzp2rHMADQ3ZFTdXeeogSm6V
            </p>
          </div>
          <p className="text-muted-foreground text-xs mt-3">
            After payment, contact admin for login credentials. Only admin can create accounts.
          </p>
        </div>

        <p className="text-center text-muted-foreground text-xs">
          mentorhub.site • Richkiddollar hunterbot
        </p>
      </div>
    </div>
  );
};

export default Login;
