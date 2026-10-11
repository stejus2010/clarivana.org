import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useEffect, useState, type FormEvent } from "react";
import { AuthLayout } from "@/components/AuthLayout";
import { useAuth } from "@/lib/auth-context";
import { getFirebase } from "@/lib/firebase";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create account — Clarivana" },
      { name: "description", content: "Create a Clarivana account to get personalised food label insights." },
      { property: "og:title", content: "Create account — Clarivana" },
      { property: "og:description", content: "Personalised food label insights." },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [f, setF] = useState({ name: "", age: "", gender: "", email: "", password: "", allergies: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  useEffect(() => {
    if (user && !busy) navigate({ to: "/" });
  }, [user, busy, navigate]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const fb = getFirebase();
    if (!fb) return;
    const name = f.name.trim(), age = f.age.trim(), email = f.email.trim(), password = f.password.trim(), allergies = f.allergies.trim();
    if (!name || !age || !f.gender || !email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setBusy(true);
    try {
      const cred = await createUserWithEmailAndPassword(fb.auth, email, password);
      await setDoc(doc(fb.db, "users", cred.user.uid), {
        name,
        age: parseInt(age),
        gender: f.gender,
        email,
        allergies: allergies ? allergies.split(",").map((a) => a.trim()).filter((a) => a) : [],
        plan: "free",
        scansToday: 0,
        analysisToday: 0,
        lastScanDate: new Date().toISOString().split("T")[0],
      });
      setError("");
      navigate({ to: "/" });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout title="Create your account" subtitle="Personalise every scan to your health needs.">
      <form onSubmit={submit} className="space-y-3">
        <input className="field" placeholder="Full name" value={f.name} onChange={set("name")} />
        <div className="grid grid-cols-2 gap-3">
          <input className="field" type="number" placeholder="Age" value={f.age} onChange={set("age")} />
          <select className="field" value={f.gender} onChange={set("gender")}>
            <option value="">Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
        <input className="field" type="email" placeholder="Email" value={f.email} onChange={set("email")} />
        <input className="field" type="password" placeholder="Password" value={f.password} onChange={set("password")} />
        <input className="field" placeholder="Allergies (comma separated, optional)" value={f.allergies} onChange={set("allergies")} />
        {error && <p className="text-[13px] text-danger">{error}</p>}
        <button disabled={busy} className="btn-base btn-primary w-full py-3">{busy ? "Creating…" : "Create account"}</button>
      </form>
      <p className="mt-5 text-center text-sm text-muted-foreground">
        Already have an account? <Link to="/login" className="text-primary hover:underline">Log in</Link>
      </p>
    </AuthLayout>
  );
}
