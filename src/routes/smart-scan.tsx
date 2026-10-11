import { createFileRoute, Link } from "@tanstack/react-router";
import { Camera, ImageUp, RotateCcw, Search, Crown, AlertTriangle, ShieldCheck, ScanLine } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { getCurrentPlan, type ClarivanaPlan } from "@/lib/premium";
import {
  checkScanLimit,
  findHarmfulIngredients,
  getUserAllergyMatches,
  saveScanResult,
  type HarmfulIngredient,
} from "@/lib/scan-engine";
import { findProduct, identifyProduct, type IdentifiedProduct, type ProductMatch } from "@/lib/smart-scan";
import CSwal from "@/lib/swal";

export const Route = createFileRoute("/smart-scan")({
  head: () => ({
    meta: [
      { title: "Smart Product Scan — Clarivana Premium" },
      { name: "description", content: "Photograph the front of a product and Clarivana finds its ingredients for you." },
      { property: "og:title", content: "Smart Product Scan — Clarivana Premium" },
      { property: "og:description", content: "Identify a product from its packaging and check its ingredients." },
    ],
  }),
  component: SmartScanPage,
});

const tone = (lvl?: string) =>
  lvl === "High" ? "text-danger border-danger/50 bg-danger/10" : lvl === "Moderate" ? "text-warning border-warning/50 bg-warning/10" : "text-success border-success/50 bg-success/10";

type Result = { product: ProductMatch; harmful: HarmfulIngredient[]; allergies: string[] };

function SmartScanPage() {
  const [plan, setPlan] = useState<ClarivanaPlan | null>(null);
  useEffect(() => {
    getCurrentPlan().then(setPlan).catch(() => setPlan("free"));
  }, []);

  return (
    <AppShell>
      <div className="fade-up">
        <p className="eyebrow">Premium scanner</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Smart Product Scan</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Photograph the front of a product — Clarivana identifies it and finds its ingredients.</p>
        {plan === null ? (
          <div className="eyebrow mt-10 animate-pulse">Checking your plan</div>
        ) : plan === "premium" ? (
          <Scanner />
        ) : (
          <div className="panel mt-8 flex flex-col items-center gap-3 p-10 text-center">
            <Crown className="h-8 w-8 text-primary" strokeWidth={1.25} />
            <h2 className="text-lg font-semibold">A Premium feature</h2>
            <p className="max-w-md text-sm text-muted-foreground">Upgrade to Premium to scan products from their front packaging. You can still scan ingredient labels for free.</p>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              <Link to="/premium" className="btn-base btn-primary px-5 py-2.5"><Crown className="h-4 w-4" /> View Premium</Link>
              <Link to="/scan" className="btn-base btn-outline px-5 py-2.5"><ScanLine className="h-4 w-4" /> Scan ingredient label</Link>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function Scanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [identified, setIdentified] = useState<IdentifiedProduct | null>(null);
  const [suggestions, setSuggestions] = useState<ProductMatch[] | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [manual, setManual] = useState("");

  useEffect(() => () => stopCamera(), []);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      setCameraOn(true);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      });
    } catch {
      CSwal.fire({ icon: "error", title: "Camera unavailable", text: "Please allow camera access or upload a photo instead." });
    }
  }
  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  }
  function reset() {
    setIdentified(null);
    setSuggestions(null);
    setResult(null);
  }

  function capture() {
    const v = videoRef.current;
    if (!v) return;
    const c = document.createElement("canvas");
    const scale = Math.min(1, 1280 / v.videoWidth);
    c.width = v.videoWidth * scale;
    c.height = v.videoHeight * scale;
    c.getContext("2d")!.drawImage(v, 0, 0, c.width, c.height);
    const url = c.toDataURL("image/jpeg", 0.85);
    stopCamera();
    setImage(url);
    run(url);
  }
  function onFile(file?: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement("canvas");
        const scale = Math.min(1, 1280 / img.width);
        c.width = img.width * scale;
        c.height = img.height * scale;
        c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
        const url = c.toDataURL("image/jpeg", 0.85);
        stopCamera();
        setImage(url);
        run(url);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  async function run(url: string) {
    reset();
    if (!(await checkScanLimit("scan"))) return;
    try {
      setBusy("Identifying product…");
      const id = await identifyProduct(url);
      if (!id.brand && !id.productName) {
        CSwal.fire({ icon: "info", title: "Couldn't identify product", text: "Try a clearer photo of the front, or enter the product name." });
        return;
      }
      setIdentified(id);
      await lookup(id);
    } catch (err) {
      console.error(err);
      CSwal.fire({ icon: "error", title: "Scan failed", text: "Please try again." });
    } finally {
      setBusy(null);
    }
  }

  async function lookup(id: IdentifiedProduct) {
    setBusy("Finding ingredients…");
    const { match, suggestions } = await findProduct(id);
    if (match) await choose(match);
    else setSuggestions(suggestions);
  }

  async function searchManual() {
    if (!manual.trim()) return;
    reset();
    const id: IdentifiedProduct = { brand: "", productName: manual.trim(), variant: "", category: "", confidence: "medium" };
    setIdentified(id);
    try {
      await lookup(id);
    } finally {
      setBusy(null);
    }
  }

  async function choose(p: ProductMatch) {
    setBusy("Checking ingredients…");
    const [harmful, allergies] = await Promise.all([findHarmfulIngredients(p.ingredients), getUserAllergyMatches(p.ingredients)]);
    await saveScanResult(p.ingredients, allergies, harmful.map((h) => h.id || h.name));
    setSuggestions(null);
    setResult({ product: p, harmful, allergies });
    setBusy(null);
    if (allergies.length) CSwal.fire({ icon: "warning", title: "Allergy Alert!", text: `Contains: ${allergies.join(", ")}` });
  }

  function scanAnother() {
    setImage(null);
    reset();
    startCamera();
  }

  return (
    <>
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="panel overflow-hidden">
          <div className="surface-grid relative flex aspect-[4/3] items-center justify-center bg-background-deep">
            {cameraOn ? (
              <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
            ) : image ? (
              <img src={image} alt="Product front" className="h-full w-full object-contain" />
            ) : (
              <div className="text-center text-muted-foreground">
                <Camera className="mx-auto h-8 w-8 text-primary" strokeWidth={1.25} />
                <p className="mt-3 text-sm">Photograph the front of the product</p>
              </div>
            )}
            {(cameraOn || busy) && <div className="scan-sweep pointer-events-none absolute inset-0" />}
            {busy && (
              <div className="absolute bottom-3 left-3 rounded-md border border-border bg-background-deep/90 px-3 py-1.5 text-xs text-primary-bright">{busy}</div>
            )}
          </div>
          <div className="flex flex-wrap gap-2 p-4">
            {cameraOn ? (
              <>
                <button onClick={capture} className="btn-base btn-primary flex-1 py-2.5"><Camera className="h-4 w-4" /> Capture</button>
                <button onClick={stopCamera} className="btn-base btn-ghost px-4">Cancel</button>
              </>
            ) : (
              <button onClick={image ? scanAnother : startCamera} disabled={!!busy} className="btn-base btn-primary flex-1 py-2.5">
                {image ? <><RotateCcw className="h-4 w-4" /> Retake</> : <><Camera className="h-4 w-4" /> Use camera</>}
              </button>
            )}
            <button onClick={() => fileRef.current?.click()} disabled={!!busy} className="btn-base btn-outline flex-1 py-2.5">
              <ImageUp className="h-4 w-4" /> {image ? "Replace photo" : "Upload photo"}
            </button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }} />
          </div>
        </div>

        <div className="panel flex flex-col p-5">
          <h2 className="text-base font-medium">Identified product</h2>
          {identified ? (
            <div className="mt-3 space-y-1 text-sm">
              {identified.brand && <p><span className="text-muted-foreground">Brand:</span> {identified.brand}</p>}
              <p><span className="text-muted-foreground">Product:</span> {identified.productName || "—"}</p>
              {identified.variant && <p><span className="text-muted-foreground">Variant:</span> {identified.variant}</p>}
              {identified.category && <p><span className="text-muted-foreground">Category:</span> {identified.category}</p>}
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">The product will appear here after scanning.</p>
          )}
          <p className="mt-6 text-[13px] text-muted-foreground">Or enter the product name</p>
          <div className="mt-2 flex gap-2">
            <input value={manual} onChange={(e) => setManual(e.target.value)} onKeyDown={(e) => e.key === "Enter" && searchManual()} placeholder="e.g. Nutella hazelnut spread" className="field flex-1" />
            <button onClick={searchManual} disabled={!!busy} className="btn-base btn-outline px-4"><Search className="h-4 w-4" /></button>
          </div>
          <Link to="/scan" className="btn-base btn-ghost mt-auto pt-6 text-[13px]"><ScanLine className="h-4 w-4" /> Scan ingredient label instead</Link>
        </div>
      </div>

      {suggestions && (
        <section className="fade-up mt-10">
          <h2 className="text-2xl font-semibold tracking-tight">We couldn't find this exact product</h2>
          {suggestions.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No similar products with recorded ingredients were found. Try entering the name, or scan the ingredient label.</p>
          ) : (
            <>
              <p className="mt-2 text-sm text-muted-foreground">These are similar products — not necessarily yours. Pick one to check its ingredients.</p>
              <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {suggestions.map((p) => (
                  <button key={p.code || p.name} onClick={() => choose(p)} className="panel flex items-center gap-3 p-4 text-left transition-colors hover:border-primary">
                    {p.image ? (
                      <img src={p.image} alt="" className="h-16 w-12 shrink-0 rounded-md border border-border object-cover" />
                    ) : (
                      <div className="flex h-16 w-12 shrink-0 items-center justify-center rounded-md border border-border bg-card-raised"><Camera className="h-5 w-5 text-primary" strokeWidth={1.25} /></div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{p.name}</p>
                      <p className="truncate text-[12px] text-muted-foreground">{[p.brand, p.quantity].filter(Boolean).join(" · ")}</p>
                      <span className="mt-1 inline-block rounded-full border border-border px-2 py-0.5 text-[10.5px] text-muted-foreground">Similar product</span>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </section>
      )}

      {result && (
        <section className="fade-up mt-10">
          <h2 className="text-2xl font-semibold tracking-tight">{result.product.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{[result.product.brand, result.product.quantity].filter(Boolean).join(" · ")}</p>
          {result.allergies.length > 0 && (
            <div className="mt-4 flex items-start gap-3 rounded-xl border border-danger/50 bg-danger/10 p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
              <div>
                <p className="text-sm font-medium text-danger">Allergy alert</p>
                <p className="text-[13px] text-muted-foreground">Contains: {result.allergies.join(", ")}</p>
              </div>
            </div>
          )}
          <h3 className="mt-6 text-base font-semibold">Flagged ingredients ({result.harmful.length})</h3>
          {result.harmful.length === 0 ? (
            <div className="mt-3 flex items-center gap-3 rounded-xl border border-success/50 bg-success/10 p-5">
              <ShieldCheck className="h-6 w-6 text-success" />
              <p className="text-sm">No harmful ingredients detected.</p>
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              {result.harmful.map((h, i) => (
                <div key={h.id || i} className="panel flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{h.name}</p>
                    {h.description && <p className="mt-1 text-[12.5px] text-muted-foreground">{h.description}</p>}
                  </div>
                  <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${tone(h.riskLevel)}`}>{h.riskLevel || "Low"}</span>
                </div>
              ))}
            </div>
          )}
          <h3 className="mt-6 text-base font-semibold">Recorded ingredients</h3>
          <div className="panel mt-3 p-4 font-mono text-[13px] leading-relaxed text-muted-foreground">{result.product.ingredients}</div>
          <p className="mt-2 text-[12px] text-muted-foreground">Ingredients come from Open Food Facts and may be incomplete or out of date. Check the pack if you have allergies.</p>
          <button onClick={scanAnother} className="btn-base btn-outline mt-5 px-5 py-2.5"><RotateCcw className="h-4 w-4" /> Scan another</button>
        </section>
      )}
    </>
  );
}
