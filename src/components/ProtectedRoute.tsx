import { useAuth } from "@/hooks/useAuth";
import { useDeviceLimit } from "@/hooks/useDeviceLimit";
import { Navigate } from "react-router-dom";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isActive, loading } = useAuth();
  const { blocked, checking } = useDeviceLimit(user?.id);

  if (loading || checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-primary font-orbitron animate-pulse tracking-wider">AUTHENTICATING...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (blocked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="glass-panel rounded-2xl p-8 glow-pink max-w-md text-center">
          <h2 className="font-orbitron text-xl text-accent font-bold mb-3">DEVICE LIMIT REACHED</h2>
          <p className="text-muted-foreground text-sm mb-2">
            Your account is already active on 3 devices. Log out from another device to continue.
          </p>
          <p className="text-xs text-muted-foreground">Contact admin if you need help.</p>
        </div>
      </div>
    );
  }

  if (!isActive) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="glass-panel rounded-2xl p-8 glow-red max-w-md text-center">
          <h2 className="font-orbitron text-xl text-destructive font-bold mb-3">ACCOUNT INACTIVE</h2>
          <p className="text-muted-foreground text-sm">Your account has been deactivated. Contact admin for reactivation.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
