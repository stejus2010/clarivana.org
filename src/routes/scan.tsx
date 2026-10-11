import { createFileRoute } from "@tanstack/react-router";
import { Camera, ImageUp, Pencil, Check, RotateCcw, Sparkles, ShieldCheck, AlertTriangle, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { generateContent } from "@/lib/gemini";
import {
  checkScanLimit,
  findHarmfulIngredients,
  getUserAllergyMatches,
  saveScanResult,
  type HarmfulIngredient,
} from "@/lib/scan-engine";
import CSwal from "@/lib/swal";

export const Route = createFileRoute("/scan")({
  head: () => ({
    meta: [
      { title: "Scan a label — Clarivana" },
      { name: "description", content: "Photograph a food ingredient label and see what's inside instantly." },
      { property: "og:title", content: "Scan a label — Clarivana" },
      { property: "og:description", content: "Photograph a food ingredient label and see what's inside." },
    ],
  }),
  component: ScanPage,
});

type AIItem = { name: string; status: string; reason: string; alternative: string | null };

const riskTone = (lvl?: string) =>
  lvl === "High" || lvl === "Harmful"
    ? "text-danger border-danger/50 bg-danger/10"
    : lvl === "Moderate" || lvl === "Caution"
      ? "text-warning border-warning/50 bg-warning/10"
      : "text-success border-success/50 bg-success/10";

function ScanPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [recognizing, setRecognizing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [done, setDone] = useState(false);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [harmful, setHarmful] = useState<HarmfulIngredient[] | null>(null);
  const [ai, setAi] = useState<AIItem[] | null>(null);
  const [aiRaw, setAiRaw] = useState<string | null>(null);
  const [aiBusy, setAiBusy] = useState(false);

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
    } catch (err) {
      console.error(err);
      CSwal.fire({ icon: "error", title: "Camera unavailable", text: "Please allow camera access or upload a photo instead." });
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  }

  function capture() {
    const v = videoRef.current;
    if (!v) return;
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    canvas.getContext("2d")!.drawImage(v, 0, 0, canvas.width, canvas.height);
    setImage(canvas.toDataURL());
    stopCamera();
    extract(canvas);
  }

  function onFile(file?: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      setImage(src);
      stopCamera();
      const img = new Image();
      img.src = src;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        canvas.getContext("2d")!.drawImage(img, 0, 0);
        extract(canvas);
      };
    };
    reader.readAsDataURL(file);
  }

  async function extract(canvas: HTMLCanvasElement) {
    resetResults();
    setText("Recognizing...");
    const allowed = await checkScanLimit("scan");
    if (!allowed) return;
    setRecognizing(true);
    try {
      const Tesseract = (await import("tesseract.js")).default;
      const { data } = await Tesseract.recognize(canvas, "eng");
      const t = data.text || "";
      setText(t);
      setDone(true);
      await analyse(t);
    } catch (err) {
      console.error("ocr err", err);
      setText("");
      CSwal.fire({ icon: "error", title: "OCR Failed", text: "Please try again." });
    } finally {
      setRecognizing(false);
    }
  }

  async function analyse(t: string) {
    const alerts = await getUserAllergyMatches(t);
    setAllergies(alerts);
    if (alerts.length > 0) {
      await CSwal.fire({ icon: "warning", title: "Allergy Alert!", text: `Contains: ${alerts.join(", ")}` });
    }
    const found = t.trim() ? await findHarmfulIngredients(t) : [];
    await saveScanResult(t, alerts, found.map((f) => f.id || f.name));
    setHarmful(found);
    // Results popup — mockup-style summary with grade ring and risk pills
    const high = found.filter((f) => f.riskLevel === "High").length;
    const mod = found.filter((f) => f.riskLevel === "Moderate").length;
    const g = high > 0 ? "D" : mod > 1 ? "C" : mod === 1 || found.length > 0 ? "B" : "A";
    const gLabel = g === "A" ? "Excellent" : g === "B" ? "Low concern" : g === "C" ? "Moderate concern" : "High concern";
    const gNote =
      g === "A"
        ? "No concerning ingredients detected in this scan."
        : g === "B"
          ? "Mostly fine, with a few ingredients worth knowing about."
          : g === "C"
            ? "Contains some additives that may not be ideal for frequent consumption."
            : "Contains high-risk ingredients. Consider healthier alternatives.";
    const toneCls = (lvl?: string) =>
      lvl === "High" ? "cv-tone-high" : lvl === "Moderate" ? "cv-tone-mod" : "cv-tone-low";
    const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

    const html =
      `<div class="cv-results">` +
      `<div class="cv-results-head">` +
      `<div class="cv-grade cv-grade-${g.toLowerCase()}">${g}</div>` +
      `<div><p class="cv-results-title">Overall assessment</p>` +
      `<p class="cv-results-label ${g === "A" || g === "B" ? "cv-ok" : g === "C" ? "cv-warn" : "cv-bad"}">${gLabel}</p>` +
      `<p class="cv-results-note">${gNote}</p></div></div>` +
      (alerts.length > 0
        ? `<div class="cv-allergy"><span>⚠</span><span><b>Allergy alert</b> — contains: ${esc(alerts.join(", "))}</span></div>`
        : "") +
      (found.length > 0
        ? `<p class="cv-section-label">Detected ingredients (${found.length})</p>` +
          found
            .map((f) => {
              const lvl = f.riskLevel || "Low";
              return `<div class="cv-ing"><div class="cv-ing-avatar ${toneCls(f.riskLevel)}">${esc((f.name || "?").charAt(0).toUpperCase())}</div><span class="cv-ing-name">${esc(f.name)}</span><span class="cv-pill ${toneCls(f.riskLevel)}">${lvl}</span></div>`;
            })
            .join("") +
          `<p class="cv-results-note" style="margin-top:8px">Full details, health insights and alternatives are shown on the page below.</p>`
        : `<div class="cv-clear">✓ No harmful ingredients detected in this scan.</div>`) +
      `</div>`;

    const res = await CSwal.fire({
      title: "Scan results",
      html,
      width: 560,
      buttonsStyling: false,
      customClass: {
        popup: "clarivana-modal",
        confirmButton: "cv-swal-btn cv-swal-primary",
        denyButton: "cv-swal-btn cv-swal-outline",
      },
      showDenyButton: true,
      confirmButtonText: "View full details",
      denyButtonText: "Scan another",
    });
    if (res.isDenied) scanAnother();
  }

  function resetResults() {
    setAllergies([]);
    setHarmful(null);
    setAi(null);
    setAiRaw(null);
  }

  function saveEdit() {
    setEditing(false);
    resetResults();
    analyse(text);
  }

  function scanAnother() {
    setImage(null);
    setText("");
    setDone(false);
    setEditing(false);
    resetResults();
    startCamera();
    CSwal.fire({ icon: "info", title: "New Scan Ready", text: "Your scanner has been refreshed.", showConfirmButton: false, timer: 1600 });
  }

  async function runAI() {
    const allowed = await checkScanLimit("ai");
    if (!allowed) return;
    const raw = text.trim();
    if (!raw) {
      CSwal.fire({ icon: "info", title: "No Ingredients Found!", text: "Please scan first." });
      return;
    }
    setAiBusy(true);
    const prompt = `You are Clarivana AI, a food safety assistant. A user has scanned a food label. Analyze the following ingredient list and respond ONLY with a JSON array (no markdown, no backticks, no extra text).

Each item in the array must have:
- "name": ingredient name (string)
- "status": one of "Harmful", "Caution", or "Safe"
- "reason": a single clear sentence (max 20 words) explaining why
- "alternative": a short, practical safer alternative (or null if Safe)

Only include ingredients that are worth flagging (Harmful or Caution). If everything is fine, return an empty array [].

Ingredients:
${raw}`;
    try {
      const out = await generateContent(prompt);
      try {
        const items = JSON.parse(out.replace(/```json|```/gi, "").trim());
        setAi(Array.isArray(items) ? items : []);
        setAiRaw(null);
      } catch {
        setAiRaw(out);
        setAi(null);
      }
    } catch (err) {
      console.error("AI Error", err);
      CSwal.fire({ icon: "error", title: "AI Analysis Failed", text: "Try again later." });
    } finally {
      setAiBusy(false);
    }
  }

  const harmfulCount = ai?.filter((i) => i.status === "Harmful").length ?? 0;
  const cautionCount = ai?.filter((i) => i.status === "Caution").length ?? 0;
  const [tab, setTab] = useState<"ingredients" | "insights" | "alternatives" | "info">("ingredients");

  // Overall assessment grade from scan + AI findings
  const highCount = (harmful ?? []).filter((h) => h.riskLevel === "High").length + harmfulCount;
  const modCount = (harmful ?? []).filter((h) => h.riskLevel === "Moderate").length + cautionCount;
  const grade = highCount > 0 ? "D" : modCount > 1 ? "C" : modCount === 1 || (harmful?.length ?? 0) > 0 ? "B" : "A";
  const gradeTone =
    grade === "A" ? "text-success border-success" : grade === "B" ? "text-success border-success" : grade === "C" ? "text-warning border-warning" : "text-danger border-danger";
  const gradeLabel =
    grade === "A" ? "Excellent" : grade === "B" ? "Low concern" : grade === "C" ? "Moderate concern" : "High concern";
  const gradeNote =
    grade === "A"
      ? "No concerning ingredients detected in this scan."
      : grade === "B"
        ? "Mostly fine, with a few ingredients worth knowing about."
        : grade === "C"
          ? "Contains some additives and ingredients that may not be ideal for frequent consumption."
          : "Contains high-risk ingredients. Consider healthier alternatives.";

  return (
    <AppShell>
      <div className="fade-up">
        <p className="eyebrow">Scanner</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Scan a food label</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Point your camera at the ingredient list, or upload a photo.</p>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          {/* Capture */}
          <div className="panel overflow-hidden">
            <div className="surface-grid relative flex aspect-[4/3] items-center justify-center bg-background-deep">
              {cameraOn ? (
                <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
              ) : image ? (
                <img src={image} alt="Captured label" className="h-full w-full object-contain" />
              ) : (
                <div className="text-center text-muted-foreground">
                  <Camera className="mx-auto h-8 w-8 text-primary" strokeWidth={1.25} />
                  <p className="mt-3 text-sm">No image yet</p>
                </div>
              )}
              {(cameraOn || recognizing) && <div className="scan-sweep pointer-events-none absolute inset-0" />}
              {recognizing && (
                <div className="absolute bottom-3 left-3 rounded-md border border-border bg-background-deep/90 px-3 py-1.5 text-xs text-primary-bright">
                  Reading ingredients…
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2 p-4">
              {cameraOn ? (
                <>
                  <button onClick={capture} className="btn-base btn-primary flex-1 py-2.5">
                    <Camera className="h-4 w-4" /> Capture
                  </button>
                  <button onClick={stopCamera} className="btn-base btn-ghost px-4">Cancel</button>
                </>
              ) : (
                <button onClick={startCamera} disabled={recognizing} className="btn-base btn-primary flex-1 py-2.5">
                  <Camera className="h-4 w-4" /> Use camera
                </button>
              )}
              <button onClick={() => fileRef.current?.click()} disabled={recognizing} className="btn-base btn-outline flex-1 py-2.5">
                <ImageUp className="h-4 w-4" /> Upload photo
              </button>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }} />
            </div>
          </div>

          {/* Text */}
          <div className="panel flex flex-col p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-medium">Extracted ingredients</h2>
              {editing ? (
                <button onClick={saveEdit} className="btn-base btn-outline h-8 px-3 text-[12px]"><Check className="h-3.5 w-3.5" /> Save</button>
              ) : (
                <button onClick={() => setEditing(true)} className="btn-base btn-ghost h-8 px-3 text-[12px]"><Pencil className="h-3.5 w-3.5" /> Edit</button>
              )}
            </div>
            <textarea
              readOnly={!editing}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Ingredients will appear here after scanning."
              className="field mt-3 min-h-48 flex-1 resize-y font-mono text-[13px] leading-relaxed"
            />
            {done && (
              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={runAI} disabled={aiBusy} className="btn-base btn-primary flex-1 py-2.5">
                  <Sparkles className="h-4 w-4" /> {aiBusy ? "Analyzing..." : "AI Analysis"}
                </button>
                <button onClick={scanAnother} className="btn-base btn-outline flex-1 py-2.5">
                  <RotateCcw className="h-4 w-4" /> Scan another
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Results — mockup "Scan results" layout */}
        {harmful && (
          <section className="fade-up mt-10">
            <h2 className="text-2xl font-semibold tracking-tight">Scan results</h2>

            {allergies.length > 0 && (
              <div className="mt-4 flex items-start gap-3 rounded-xl border border-danger/50 bg-danger/10 p-4">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
                <div>
                  <p className="text-sm font-medium text-danger">Allergy alert</p>
                  <p className="text-[13px] text-muted-foreground">Contains: {allergies.join(", ")}</p>
                </div>
              </div>
            )}

            {/* Product summary + overall assessment */}
            <div className="mt-5 grid gap-4 md:grid-cols-[1.4fr_1fr]">
              <div className="panel flex items-center gap-4 p-4">
                {image ? (
                  <img src={image} alt="Scanned label" className="h-20 w-16 shrink-0 rounded-lg border border-border object-cover" />
                ) : (
                  <div className="flex h-20 w-16 shrink-0 items-center justify-center rounded-lg border border-border bg-card-raised">
                    <Camera className="h-6 w-6 text-primary" strokeWidth={1.25} />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold">Scanned product</p>
                  <p className="mt-1 text-[12.5px] text-muted-foreground">Category: Packaged food</p>
                  <p className="text-[12.5px] text-muted-foreground">
                    Scanned on {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })},{" "}
                    {new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                  </p>
                </div>
              </div>
              <div className="panel flex items-center gap-4 p-4">
                <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-[3px] text-2xl font-bold ${gradeTone}`}>
                  {grade}
                </div>
                <div>
                  <p className="eyebrow">Overall assessment</p>
                  <p className={`mt-0.5 text-sm font-semibold ${gradeTone.split(" ")[0]}`}>{gradeLabel}</p>
                  <p className="mt-1 text-[12px] leading-snug text-muted-foreground">{gradeNote}</p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-5 flex flex-wrap gap-2">
              {(
                [
                  ["ingredients", "Ingredients"],
                  ["insights", "Health insights"],
                  ["alternatives", "Alternatives"],
                  ["info", "Product info"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`btn-base h-9 rounded-full px-4 text-[13px] ${tab === key ? "btn-primary" : "btn-outline"}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Ingredients tab */}
            {tab === "ingredients" && (
              <div className="mt-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold">Detected Ingredients ({harmful.length})</h3>
                  <span className="text-[12px] text-muted-foreground">Sort by <b className="text-foreground">Risk level</b></span>
                </div>
                {harmful.length === 0 ? (
                  <div className="mt-4 flex items-center gap-3 rounded-xl border border-success/50 bg-success/10 p-5">
                    <ShieldCheck className="h-6 w-6 text-success" />
                    <div>
                      <p className="font-medium text-success">All clear</p>
                      <p className="text-[13px] text-muted-foreground">No harmful ingredients detected in this scan.</p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 space-y-2">
                    {harmful.map((ing, i) => <IngredientRow key={ing.id || i} ing={ing} />)}
                  </div>
                )}
              </div>
            )}

            {/* Health insights tab */}
            {tab === "insights" && (
              <div className="mt-5">
                {!ai && !aiRaw ? (
                  <div className="panel flex flex-col items-center gap-3 p-8 text-center">
                    <Sparkles className="h-7 w-7 text-primary" strokeWidth={1.25} />
                    <p className="text-sm text-muted-foreground">Run the AI analysis to get health insights for this product.</p>
                    <button onClick={runAI} disabled={aiBusy} className="btn-base btn-primary px-5 py-2.5">
                      <Sparkles className="h-4 w-4" /> {aiBusy ? "Analyzing..." : "AI Analysis"}
                    </button>
                  </div>
                ) : aiRaw ? (
                  <div className="panel whitespace-pre-wrap p-5 text-sm text-muted-foreground">{aiRaw}</div>
                ) : ai!.length === 0 ? (
                  <div className="flex items-center gap-3 rounded-xl border border-success/50 bg-success/10 p-5">
                    <ShieldCheck className="h-6 w-6 text-success" />
                    <p className="text-sm">Clarivana AI found no ingredients worth flagging in this product.</p>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Found <span className="text-danger">{harmfulCount} harmful</span> and <span className="text-warning">{cautionCount} caution</span> ingredient{harmfulCount + cautionCount !== 1 ? "s" : ""}.
                    </p>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      {ai!.map((item, i) => (
                        <div key={i} className="panel p-4">
                          <div className="flex items-center justify-between gap-2">
                            <strong className="text-sm font-medium">{item.name || "Unknown"}</strong>
                            <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${riskTone(item.status)}`}>{item.status}</span>
                          </div>
                          <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{item.reason}</p>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Alternatives tab */}
            {tab === "alternatives" && (
              <div className="mt-5">
                {!ai && !aiRaw ? (
                  <div className="panel flex flex-col items-center gap-3 p-8 text-center">
                    <Sparkles className="h-7 w-7 text-primary" strokeWidth={1.25} />
                    <p className="text-sm text-muted-foreground">Run the AI analysis to discover safer alternatives.</p>
                    <button onClick={runAI} disabled={aiBusy} className="btn-base btn-primary px-5 py-2.5">
                      <Sparkles className="h-4 w-4" /> {aiBusy ? "Analyzing..." : "AI Analysis"}
                    </button>
                  </div>
                ) : (
                  <>
                    {ai && ai.some((i) => i.alternative) ? (
                      <div className="grid gap-3 md:grid-cols-2">
                        {ai.filter((i) => i.alternative).map((item, i) => (
                          <div key={i} className="panel p-4">
                            <strong className="text-sm font-medium">{item.name}</strong>
                            <div className="mt-2 rounded-r-md border-l-2 border-primary bg-card-raised px-3 py-2 text-[12.5px] text-primary-bright">
                              <b>Try instead:</b> {item.alternative}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="panel p-5 text-sm text-muted-foreground">No alternatives to suggest for this product.</div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Product info tab */}
            {tab === "info" && (
              <div className="panel mt-5 p-5">
                <p className="eyebrow mb-2">Extracted ingredient list</p>
                <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-muted-foreground">{text || "No text extracted."}</p>
              </div>
            )}
          </section>
        )}
      </div>
    </AppShell>
  );
}

function IngredientRow({ ing }: { ing: HarmfulIngredient }) {
  const [open, setOpen] = useState(false);
  const effects = (ing.healthEffects || []).slice(0, 3);
  const lvl = ing.riskLevel || "Unknown";
  const dotTone =
    lvl === "High" ? "bg-danger text-danger" : lvl === "Moderate" ? "bg-warning text-warning" : "bg-success text-success";
  return (
    <div className="panel overflow-hidden">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center gap-3 p-3.5 text-left">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-background ${dotTone.split(" ")[0]}`}>
          {ing.name.charAt(0).toUpperCase()}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{ing.name}</span>
          {ing.description && <span className="block truncate text-[12px] text-muted-foreground">{ing.description}</span>}
        </span>
        <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${riskTone(lvl)}`}>{lvl}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="space-y-3 border-t border-border p-4 text-[12.5px]">
          {ing.category && <p className="text-subtle-foreground">Category: {ing.category}</p>}
          {ing.description && <p className="leading-relaxed text-muted-foreground">{ing.description}</p>}
          {effects.length > 0 && (
            <div>
              <p className="eyebrow mb-1">Health effects</p>
              <ul className="ml-4 list-disc text-muted-foreground">{effects.map((h: { effect: string }, i: number) => <li key={i}>{h.effect}</li>)}</ul>
            </div>
          )}
          {(ing.toxicity?.acute || ing.toxicity?.chronic) && (
            <div>
              <p className="eyebrow mb-1">Toxicity</p>
              {ing.toxicity?.acute && <p className="text-muted-foreground"><b className="text-foreground">Acute:</b> {ing.toxicity.acute}</p>}
              {ing.toxicity?.chronic && <p className="text-muted-foreground"><b className="text-foreground">Chronic:</b> {ing.toxicity.chronic}</p>}
            </div>
          )}
          {ing.regulatoryStatus && (
            <div>
              <p className="eyebrow mb-1">Regulatory status</p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(ing.regulatoryStatus).map(([k, v]) => (
                  <span key={k} className="rounded-md border border-border bg-card-raised px-2 py-0.5"><b>{k}:</b> {v}</span>
                ))}
              </div>
            </div>
          )}
          {ing.references && ing.references.length > 0 && (
            <div>
              <p className="eyebrow mb-1">Sources</p>
              <ul className="ml-4 list-disc">
                {ing.references.map((r) => (
                  <li key={r}><a href={r} target="_blank" rel="noopener noreferrer" className="break-all text-primary hover:underline">{r}</a></li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

