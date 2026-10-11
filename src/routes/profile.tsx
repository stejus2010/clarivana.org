import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Cake, Crown, HeartPulse, LogOut, Mail, Pencil, ScanLine, ShieldAlert, Sparkles, User, VenusAndMars } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth-context";
import { getFirebase } from "@/lib/firebase";
import CSwal from "@/lib/swal";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "My Profile — Clarivana" },
      { name: "description", content: "Manage your Clarivana profile, allergies and preferences." },
      { property: "og:title", content: "My Profile — Clarivana" },
      { property: "og:description", content: "Manage your Clarivana profile, allergies and preferences." },
    ],
  }),
  component: ProfilePage,
});

type Profile = {
  name?: string;
  email?: string;
  age?: number;
  gender?: string;
  allergies?: string[];
  plan?: string;
  scansToday?: number;
  analysisToday?: number;
};

const inputCls =
  "width:100%;background:var(--color-background-raised);border:1px solid var(--color-border);border-radius:10px;padding:0.6875rem 0.875rem;font-size:0.9rem;color:var(--color-foreground);margin:6px 0;";

function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    const fb = getFirebase();
    if (!fb?.auth.currentUser) return;
    const snap = await getDoc(doc(fb.db, "users", fb.auth.currentUser.uid));
    setProfile(snap.exists() ? (snap.data() as Profile) : {});
    setLoading(false);
  }

  useEffect(() => {
    if (user) load();
  }, [user]);

  async function save(patch: Partial<Profile>) {
    const fb = getFirebase();
    if (!fb?.auth.currentUser) return;
    try {
      await setDoc(doc(fb.db, "users", fb.auth.currentUser.uid), patch, { merge: true });
      setProfile((p) => ({ ...p, ...patch }));
      CSwal.fire({ icon: "success", title: "Saved", text: "Your profile was updated.", timer: 1400, showConfirmButton: false });
    } catch (err: any) {
      CSwal.fire({ icon: "error", title: "Error", text: err.message });
    }
  }

  async function editDetails() {
    const p = profile || {};
    const result = await CSwal.fire({
      title: "Edit profile",
      buttonsStyling: false,
      customClass: {
        popup: "clarivana-modal",
        confirmButton: "cv-swal-btn cv-swal-primary",
        cancelButton: "cv-swal-btn cv-swal-outline",
      },
      html:
        `<input id="sw-name" style="${inputCls}" placeholder="Name" value="${p.name || ""}">` +
        `<input id="sw-age" type="number" style="${inputCls}" placeholder="Age" value="${p.age || ""}">` +
        `<select id="sw-gender" style="${inputCls}">
          <option value="">Select gender</option>
          <option value="Male" ${p.gender === "Male" ? "selected" : ""}>Male</option>
          <option value="Female" ${p.gender === "Female" ? "selected" : ""}>Female</option>
          <option value="Other" ${p.gender === "Other" ? "selected" : ""}>Other</option>
        </select>`,
      showCancelButton: true,
      confirmButtonText: "Save changes",
      cancelButtonText: "Cancel",
      preConfirm: () => {
        const name = (document.getElementById("sw-name") as HTMLInputElement).value.trim();
        const age = parseInt((document.getElementById("sw-age") as HTMLInputElement).value);
        const gender = (document.getElementById("sw-gender") as HTMLSelectElement).value;
        if (!name || !age || !gender) {
          CSwal.showValidationMessage("Please fill name, age and gender.");
          return false;
        }
        return { name, age, gender };
      },
    });
    if (result.isConfirmed && result.value) save(result.value);
  }

  async function editAllergies() {
    const p = profile || {};
    const result = await CSwal.fire({
      title: "My allergies",
      text: "Separate multiple allergies with commas.",
      buttonsStyling: false,
      customClass: {
        popup: "clarivana-modal",
        confirmButton: "cv-swal-btn cv-swal-primary",
        cancelButton: "cv-swal-btn cv-swal-outline",
      },
      html: `<input id="sw-allergies" style="${inputCls}" placeholder="e.g. peanuts, milk, soy" value="${(p.allergies || []).join(", ")}">`,
      showCancelButton: true,
      confirmButtonText: "Save allergies",
      cancelButtonText: "Cancel",
      preConfirm: () => ({
        allergies: (document.getElementById("sw-allergies") as HTMLInputElement).value
          .split(",")
          .map((a) => a.trim())
          .filter(Boolean),
      }),
    });
    if (result.isConfirmed && result.value) save(result.value);
  }

  async function handleLogout() {
    const fb = getFirebase();
    if (!fb) return;
    await signOut(fb.auth);
    navigate({ to: "/login" });
  }

  const initial = (profile?.name || user?.email || "?").charAt(0).toUpperCase();
  const allergies = profile?.allergies || [];

  return (
    <AppShell>
      <div className="fade-up mx-auto max-w-3xl">
        <p className="eyebrow">Account</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">My Profile</h1>

        {loading ? (
          <div className="eyebrow mt-16 animate-pulse text-center">Loading profile</div>
        ) : (
          <>
            {/* Identity card */}
            <div className="panel mt-8 flex flex-col items-center gap-4 p-6 sm:flex-row sm:items-center sm:gap-6">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-card-raised text-3xl font-bold text-primary">
                {initial}
              </div>
              <div className="min-w-0 flex-1 text-center sm:text-left">
                <p className="truncate text-xl font-semibold">{profile?.name || "Clarivana user"}</p>
                <p className="mt-0.5 flex items-center justify-center gap-1.5 text-sm text-muted-foreground sm:justify-start">
                  <Mail className="h-3.5 w-3.5" /> {profile?.email || user?.email}
                </p>
                <span className="mt-2 inline-block rounded-full border border-primary/40 bg-primary/10 px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
                  {profile?.plan || "Free"} plan
                </span>
              </div>
              <button onClick={editDetails} className="btn-base btn-primary h-10 px-4 text-[13px]">
                <Pencil className="h-4 w-4" /> Edit profile
              </button>
            </div>

            {/* Stats */}
            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                { icon: ScanLine, label: "Scans today", value: profile?.scansToday ?? 0 },
                { icon: Sparkles, label: "AI analyses today", value: profile?.analysisToday ?? 0 },
                { icon: ShieldAlert, label: "Allergies tracked", value: allergies.length },
              ].map((s) => (
                <div key={s.label} className="panel flex flex-col items-center gap-1.5 p-4 text-center">
                  <s.icon className="h-5 w-5 text-primary" strokeWidth={1.5} />
                  <p className="text-2xl font-semibold">{s.value}</p>
                  <p className="text-[11.5px] text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>

            {profile?.plan === "premium" ? (
              <div className="mt-4 flex flex-col gap-4 rounded-xl border border-primary/50 bg-card p-5 shadow-[var(--glow-primary)] sm:flex-row sm:items-center">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-primary">
                  <Crown className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-primary-bright">Clarivana Premium is active</p>
                  <p className="mt-1 text-[13px] text-muted-foreground">Unlimited scans, AI analyses and deeper food insights.</p>
                </div>
                <Link to="/premium" className="btn-base btn-outline h-10 px-4 text-[13px]">Manage plan</Link>
              </div>
            ) : (
              <div className="mt-4 flex flex-col gap-4 rounded-xl border border-primary/40 bg-card p-5 sm:flex-row sm:items-center">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-primary">
                  <Crown className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">Unlock unlimited food insights</p>
                  <p className="mt-1 text-[13px] text-muted-foreground">Try Premium for $2.99/month in the competition demo.</p>
                </div>
                <Link to="/premium" className="btn-base btn-primary h-10 px-4 text-[13px]">View Premium</Link>
              </div>
            )}

            {/* Personal details */}
            <div className="panel mt-4 p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold">Personal details</h2>
                <button onClick={editDetails} className="btn-base btn-ghost h-8 px-3 text-[12px]">
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
              </div>
              <div className="mt-3 divide-y divide-border">
                {[
                  { icon: User, label: "Name", value: profile?.name || "—" },
                  { icon: Cake, label: "Age", value: profile?.age ? String(profile.age) : "—" },
                  { icon: VenusAndMars, label: "Gender", value: profile?.gender || "—" },
                ].map((r) => (
                  <div key={r.label} className="flex items-center gap-3 py-3">
                    <r.icon className="h-4 w-4 text-primary-muted" strokeWidth={1.5} />
                    <span className="flex-1 text-sm text-muted-foreground">{r.label}</span>
                    <span className="text-sm font-medium">{r.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Preferences */}
            <div className="panel mt-4 p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold">Preferences</h2>
                <button onClick={editAllergies} className="btn-base btn-ghost h-8 px-3 text-[12px]">
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
              </div>
              <div className="mt-3 flex items-start gap-3">
                <HeartPulse className="mt-0.5 h-4 w-4 shrink-0 text-primary-muted" strokeWidth={1.5} />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Allergy alerts</p>
                  <p className="mt-0.5 text-[12.5px] text-subtle-foreground">
                    Clarivana warns you when a scanned product contains any of these.
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {allergies.length === 0 ? (
                      <span className="text-[13px] text-subtle-foreground">No allergies set — tap Edit to add some.</span>
                    ) : (
                      allergies.map((a) => (
                        <span key={a} className="rounded-full border border-warning/50 bg-warning/10 px-3 py-1 text-[12px] font-medium text-warning">
                          {a}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Sign out */}
            <button onClick={handleLogout} className="btn-base btn-outline mt-6 w-full py-3 text-danger hover:border-danger/60 hover:text-danger">
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </>
        )}
      </div>
    </AppShell>
  );
}
