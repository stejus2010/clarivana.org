import { createFileRoute } from "@tanstack/react-router";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth-context";
import { getFirebase } from "@/lib/firebase";
import CSwal from "@/lib/swal";

export const Route = createFileRoute("/allergies")({
  head: () => ({
    meta: [
      { title: "My allergies — Clarivana" },
      { name: "description", content: "Tell Clarivana what to watch for in every scan." },
      { property: "og:title", content: "My allergies — Clarivana" },
      { property: "og:description", content: "Personalise your ingredient warnings." },
    ],
  }),
  component: AllergiesPage,
});

function AllergiesPage() {
  const { user } = useAuth();
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fb = getFirebase();
    if (!fb || !user) return;
    getDoc(doc(fb.db, "users", user.uid)).then((snap) => {
      const data: any = snap.exists() ? snap.data() : {};
      setValue((data.allergies || []).join(", "));
    });
  }, [user]);

  async function save() {
    const fb = getFirebase();
    if (!fb?.auth.currentUser) return;
    setSaving(true);
    const arr = value.split(",").map((a) => a.trim()).filter(Boolean);
    await setDoc(doc(fb.db, "users", fb.auth.currentUser.uid), { allergies: arr }, { merge: true });
    setSaving(false);
    CSwal.fire("Saved", "Allergies updated", "success");
  }

  const chips = value.split(",").map((a) => a.trim()).filter(Boolean);

  return (
    <AppShell>
      <div className="fade-up mx-auto max-w-2xl">
        <p className="eyebrow">Personalisation</p>
        <h1 className="mt-3 text-[32px] font-semibold tracking-[-0.02em]">My allergies</h1>
        <p className="mt-2 text-[15px] text-muted-foreground">
          Every scan is checked against this list, so you get warned before you eat.
        </p>

        <div className="panel mt-7 p-5">
          <label htmlFor="allergies" className="text-sm font-medium">
            Your allergies
          </label>
          <p className="mt-1 text-[13px] text-subtle-foreground">Comma separated</p>
          <textarea
            id="allergies"
            className="field mt-3 min-h-28 resize-y"
            placeholder="Peanuts, Gluten"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />

          {chips.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {chips.map((c, i) => (
                <span
                  key={`${c}-${i}`}
                  className="rounded-full border border-border-strong bg-card-raised px-3 py-1 text-[12px] text-secondary-foreground"
                >
                  {c}
                </span>
              ))}
            </div>
          )}

          <button onClick={save} disabled={saving} className="btn-base btn-primary mt-6">
            {saving ? "Saving…" : "Save allergies"}
          </button>
        </div>
      </div>
    </AppShell>
  );
}
