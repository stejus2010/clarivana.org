import { Link, useNavigate } from "@tanstack/react-router";
import { signOut } from "firebase/auth";
import { Home, ScanLine, Sparkles, ShieldAlert, MessageSquare, Clock, User, Crown } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import logo from "@/assets/logo.png";
import { useAuth } from "@/lib/auth-context";
import { getFirebase } from "@/lib/firebase";

const NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/scan", label: "Scan", icon: ScanLine },
  { to: "/smart-scan", label: "Smart Scan", icon: Sparkles },
  { to: "/allergies", label: "Allergies", icon: ShieldAlert },
  { to: "/chat", label: "Assistant", icon: MessageSquare },
  { to: "/history", label: "History", icon: Clock },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  async function handleLogout() {
    const fb = getFirebase();
    if (!fb) return;
    await signOut(fb.auth);
    navigate({ to: "/login" });
  }

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="eyebrow animate-pulse">Loading Clarivana</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background-deep/90 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-8 px-5">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={logo} alt="" className="h-7 w-7 rounded-md object-contain" />
            <span className="text-[17px] font-semibold tracking-tight">Clarivana</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/" }}
                className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                activeProps={{ className: "text-primary bg-card-raised" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Link to="/premium" className="btn-base btn-ghost h-9 px-3 text-[13px] text-primary" aria-label="Clarivana Premium" title="Clarivana Premium">
              <Crown className="h-4 w-4" />
              <span className="hidden lg:inline">Premium</span>
            </Link>
            <Link to="/profile" className="btn-base btn-outline h-9 px-3 text-[13px]">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </Link>
            <button onClick={handleLogout} className="btn-base btn-ghost h-9 px-3 text-[13px]">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 pb-28 pt-8 md:pb-16">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background-deep/95 backdrop-blur-sm md:hidden">
        <div className="grid grid-cols-5">
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/" }}
                className="flex flex-col items-center gap-1 py-2.5 text-[11px] text-subtle-foreground transition-colors"
                activeProps={{ className: "text-primary" }}
              >
                <Icon className="h-[18px] w-[18px]" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
