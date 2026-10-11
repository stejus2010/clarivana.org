import { createFileRoute, Link } from "@tanstack/react-router";
import { collection, getDocs, limit, orderBy, query, writeBatch } from "firebase/firestore";
import { Clock, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth-context";
import { getFirebase } from "@/lib/firebase";
import CSwal from "@/lib/swal";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Scan history — Clarivana" },
      { name: "description", content: "Review your past food label scans." },
      { property: "og:title", content: "Scan history — Clarivana" },
      { property: "og:description", content: "Review your past food label scans." },
    ],
  }),
  component: HistoryPage,
});

type Item = { id: string; timestamp: any; ingredients?: string; allergiesFound?: string[]; harmfulNotes?: string[]; notes?: string };

function HistoryPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[] | null>(null);

  const load = useCallback(async () => {
    const fb = getFirebase();
    if (!fb || !user) return;
    setItems(null);
    const snap = await getDocs(query(collection(fb.db, "users", user.uid, "history"), orderBy("timestamp", "desc"), limit(50)));
    setItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  async function clear() {
    const fb = getFirebase();
    if (!fb || !user) return;
    const ok = await CSwal.fire({ title: "Clear history?", text: "This will remove all saved scans.", icon: "warning", showCancelButton: true, confirmButtonText: "Clear" });
    if (!ok.isConfirmed) return;
    const snap = await getDocs(collection(fb.db, "users", user.uid, "history"));
    const batch = writeBatch(fb.db);
    snap.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    load();
    CSwal.fire("Cleared", "History cleared", "success");
  }

  return (
    <AppShell>
      <div className="fade-up">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Your scans</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Scan history</h1>
          </div>
          <button onClick={clear} className="btn-base btn-outline h-9 px-3 text-[13px]">
            <Trash2 className="h-4 w-4" /> Clear history
          </button>
        </div>

        <div className="mt-8 space-y-3">
          {items === null && <p className="eyebrow animate-pulse">Loading…</p>}
          {items?.length === 0 && (
            <div className="panel flex flex-col items-center p-10 text-center">
              <Clock className="h-6 w-6 text-primary" strokeWidth={1.5} />
              <p className="mt-3 text-sm text-muted-foreground">No scans yet</p>
              <Link to="/scan" className="btn-base btn-primary mt-5 px-4 py-2">Scan a product</Link>
            </div>
          )}
          {items?.map((d) => {
            const harmful = d.harmfulNotes?.length ?? 0;
            const allergies = d.allergiesFound?.length ?? 0;
            const tone = allergies || harmful ? (allergies ? "text-danger border-danger/40" : "text-warning border-warning/40") : "text-success border-success/40";
            const label = allergies ? "Allergy alert" : harmful ? `${harmful} flagged` : "All clear";
            return (
              <div key={d.id} className="panel p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <strong className="text-sm font-medium">
                    {new Date(d.timestamp?.toMillis?.() || d.timestamp).toLocaleString()}
                  </strong>
                  <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${tone}`}>{label}</span>
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{(d.ingredients || "").slice(0, 250)}</p>
                {d.notes && <p className="mt-1.5 text-[13px] text-primary-bright">{d.notes}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
