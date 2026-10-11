import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { getFirebase } from "./firebase";
import { FREE_AI_LIMIT, FREE_SCAN_LIMIT } from "./premium";
import CSwal from "./swal";

export type HealthEffect = { effect: string };
export type HarmfulIngredient = {
  id?: string;
  name: string;
  aliases?: string[];
  category?: string;
  riskLevel?: "High" | "Moderate" | "Low" | string;
  description?: string;
  healthEffects?: HealthEffect[];
  regulatoryStatus?: Record<string, string>;
  references?: string[];
  toxicity?: { acute?: string; chronic?: string };
};

let harmfulList: HarmfulIngredient[] | null = null;

export async function loadHarmfulIngredients(): Promise<HarmfulIngredient[]> {
  if (harmfulList) return harmfulList;
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}data/ingredients_pro_mode.json`);
    const data = await res.json();
    harmfulList = (data.harmfulIngredients || []) as HarmfulIngredient[];
  } catch (err) {
    console.error("ingredients.json load err", err);
    harmfulList = [];
  }
  return harmfulList;
}

// ─── Helpers (ported unchanged) ──────────────────────────────────────────────

export const normalize = (s: string) =>
  s
    .toLowerCase()
    .replace(/\u2019/g, "'")
    .replace(/[\u2010-\u2015]/g, "-")
    .replace(/[^a-z0-9\s\-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function levenshtein(a: string, b: string) {
  const m = a.length,
    n = b.length;
  if (!m) return n;
  if (!n) return m;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i]![0] = i;
  for (let j = 0; j <= n; j++) dp[0]![j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i]![j] = Math.min(dp[i - 1]![j]! + 1, dp[i]![j - 1]! + 1, dp[i - 1]![j - 1]! + cost);
    }
  return dp[m]![n]!;
}

function conservativeFuzzyMatch(a: string, b: string) {
  const A = a.replace(/\s+/g, "").toLowerCase();
  const B = b.replace(/\s+/g, "").toLowerCase();
  const maxLen = Math.max(A.length, B.length);
  if (maxLen < 6) return false;
  return levenshtein(A, B) / maxLen <= 0.15;
}

function hasWholePhrase(phrase: string, text: string, tokens: Set<string>) {
  if (!phrase?.trim()) return false;
  const p = normalize(phrase);
  if (/[0-9]/.test(p)) {
    for (const v of [p, p.replace(/\s+/g, ""), p.replace(/\s+/g, "-"), p.replace(/[-_]+/g, " ")]) {
      if (new RegExp(`\\b${escapeRegex(v)}\\b`, "i").test(text)) return true;
    }
    return false;
  }
  if (new RegExp(`\\b${escapeRegex(p)}\\b`, "i").test(text)) return true;
  const parts = p.split(/\s+/).filter(Boolean);
  if (parts.length > 1) {
    let start = 0,
      ok = true;
    for (const part of parts) {
      const m = new RegExp(`\\b${escapeRegex(part)}\\b`, "i").exec(text.slice(start));
      if (!m) {
        ok = false;
        break;
      }
      start += m.index + part.length;
    }
    if (ok) return true;
  }
  return parts.length === 1 && tokens.has(parts[0]!);
}

const GENERIC_BLACKLIST = new Set([
  "yellow", "red", "blue", "white", "black", "green", "natural", "artificial",
  "flavour", "flavor", "colour", "color", "corn", "meal", "malted", "barley",
  "flour", "water", "sugar", "salt", "oil", "extract",
]);

// ─── Usage limits (ported unchanged) ─────────────────────────────────────────

export async function checkScanLimit(type: "scan" | "ai" = "scan") {
  const fb = getFirebase();
  if (!fb) return false;
  const user = fb.auth.currentUser;
  if (!user) {
    CSwal.fire({
      icon: "info",
      title: "Login Required",
      text: "Please log in to use Clarivana's scanning features.",
      confirmButtonText: "Got it",
    });
    return false;
  }

  const ref = doc(fb.db, "users", user.uid);
  const snap = await getDoc(ref);
  const today = new Date().toISOString().split("T")[0];
  let data: any = snap.exists() ? snap.data() : null;

  if (!data) {
    data = { plan: "free", scansToday: 0, analysisToday: 0, lastScanDate: today };
    await setDoc(ref, data);
  }
  if (data.lastScanDate !== today) {
    await updateDoc(ref, { scansToday: 0, analysisToday: 0, lastScanDate: today });
    data.scansToday = 0;
    data.analysisToday = 0;
  }

  const maxScans = FREE_SCAN_LIMIT,
    maxAI = FREE_AI_LIMIT;
  if (data.plan === "free") {
    if (type === "scan" && data.scansToday >= maxScans) {
      const result = await CSwal.fire({
        icon: "info",
        title: "Daily Scan Limit Reached",
        text: "Upgrade to Premium for unlimited scans.",
        showCancelButton: true,
        confirmButtonText: "View Premium",
        cancelButtonText: "Not now",
        buttonsStyling: false,
        customClass: {
          confirmButton: "cv-swal-btn cv-swal-primary",
          cancelButton: "cv-swal-btn cv-swal-outline",
        },
      });
      if (result.isConfirmed) window.location.assign("/premium");
      return false;
    }
    if (type === "ai" && data.analysisToday >= maxAI) {
      const result = await CSwal.fire({
        icon: "info",
        title: "Daily AI Analysis Limit Reached",
        text: "Upgrade to Premium for unlimited analyses.",
        showCancelButton: true,
        confirmButtonText: "View Premium",
        cancelButtonText: "Not now",
        buttonsStyling: false,
        customClass: {
          confirmButton: "cv-swal-btn cv-swal-primary",
          cancelButton: "cv-swal-btn cv-swal-outline",
        },
      });
      if (result.isConfirmed) window.location.assign("/premium");
      return false;
    }
  }

  await updateDoc(ref, {
    [type === "scan" ? "scansToday" : "analysisToday"]:
      (type === "scan" ? data.scansToday : data.analysisToday) + 1,
    lastScanDate: today,
  });

  return true;
}

// ─── Detection ───────────────────────────────────────────────────────────────

export async function findHarmfulIngredients(extractedText: string) {
  const list = await loadHarmfulIngredients();
  if (!extractedText?.trim()) return [] as HarmfulIngredient[];

  const text = normalize(extractedText);
  const tokens = new Set(text.split(/\s+/).filter(Boolean));
  const found: HarmfulIngredient[] = [];
  const foundIds = new Set<string>();

  for (const ing of list) {
    if (!ing?.name) continue;
    const candidates = [ing.name, ing.id, ...(ing.aliases || [])].map((c) => normalize(String(c ?? "")));
    let matched = false;

    for (const c of candidates) {
      if (!c) continue;
      if (
        c.split(/\s+/).length === 1 &&
        GENERIC_BLACKLIST.has(c) &&
        !/[0-9]/.test(c) &&
        !ing.id?.match(/[0-9]/)
      )
        continue;
      if (hasWholePhrase(c, text, tokens)) {
        matched = true;
        break;
      }
    }

    if (!matched) {
      for (const c of candidates) {
        if (!c || c.replace(/\s+/g, "").length < 6) continue;
        if (conservativeFuzzyMatch(c, text)) {
          if (c.split(/\s+/).map((p) => tokens.has(p)).some(Boolean)) {
            matched = true;
            break;
          }
        }
      }
    }

    const key = ing.id || ing.name;
    if (matched && !foundIds.has(key)) {
      foundIds.add(key);
      found.push(ing);
    }
  }

  return found;
}

export async function getUserAllergyMatches(extractedText: string) {
  const fb = getFirebase();
  if (!fb) return [] as string[];
  const user = fb.auth.currentUser;
  if (!user) return [];
  const snap = await getDoc(doc(fb.db, "users", user.uid));
  if (!snap.exists()) return [];
  const allergies: string[] = snap.data()['allergies'] || [];
  const textLower = extractedText.toLowerCase();
  return allergies.filter((a) => a && textLower.includes(a.toLowerCase()));
}

export async function saveScanResult(
  extractedText: string,
  allergyAlerts: string[],
  foundIds: string[],
) {
  const fb = getFirebase();
  if (!fb) return;
  const user = fb.auth.currentUser;
  const payload = {
    timestamp: serverTimestamp(),
    ingredients: (extractedText || "").slice(0, 2000),
    allergiesFound: allergyAlerts,
    harmfulNotes: foundIds,
  };
  try {
    if (user) {
      await addDoc(collection(fb.db, "users", user.uid, "history"), payload);
    } else {
      const arr = JSON.parse(localStorage.getItem("localHistory") || "[]");
      arr.unshift({ ...payload, timestamp: Date.now() });
      localStorage.setItem("localHistory", JSON.stringify(arr.slice(0, 50)));
    }
  } catch (err) {
    console.error("saveScan err", err);
  }
}
