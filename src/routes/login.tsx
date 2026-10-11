import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useEffect, useState, type FormEvent } from "react";
import { AuthLayout } from "@/components/AuthLayout";
import { useAuth } from "@/lib/auth-context";
import { getFirebase } from "@/lib/firebase";
import CSwal from "@/lib/swal";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log in — Clarivana" },
      { name: "description", content: "Log in to scan food labels with Clarivana." },
      { property: "og:title", content: "Log in — Clarivana" },
      { property: "og:description", content: "Log in to scan food labels with Clarivana." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/" });
  }, [user, navigate]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const fb = getFirebase();
    if (!fb) return;
    if (!email.trim() || !password.trim()) {
      setError("Please enter email and password.");
      return;
    }
    setBusy(true);
    try {
      await signInWithEmailAndPassword(fb.auth, email.trim(), password.trim());
      setError("");
      navigate({ to: "/" });
    } catch (err: any) {
      if (err.code === "auth/user-not-found") {
        const r = await CSwal.fire({
          icon: "info",
          title: "Account not found",
          text: "Do you want to sign up?",
          showCancelButton: true,
          confirmButtonText: "Sign Up",
        });
        if (r.isConfirmed) navigate({ to: "/signup" });
      } else setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to continue scanning.">
      <form onSubmit={submit} className="space-y-3">
        <input className="field" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="field" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p className="text-[13px] text-danger">{error}</p>}
        <button disabled={busy} className="btn-base btn-primary w-full py-3">{busy ? "Logging in…" : "Log in"}</button>
      </form>
      <p className="mt-5 text-center text-sm text-muted-foreground">
        New to Clarivana? <Link to="/signup" className="text-primary hover:underline">Create an account</Link>
      </p>
    </AuthLayout>
  );
}
