import { GEMINI_API_KEY, MODEL } from "./gemini";

export type IdentifiedProduct = {
  brand: string;
  productName: string;
  variant: string;
  category: string;
  confidence: "high" | "medium" | "low";
};

export type ProductMatch = {
  code: string;
  name: string;
  brand: string;
  quantity: string;
  image: string | null;
  ingredients: string;
};

/** Ask Gemini to identify a product from a photo of its front packaging. Never asks for ingredients. */
export async function identifyProduct(dataUrl: string): Promise<IdentifiedProduct> {
  const [meta, base64] = dataUrl.split(",");
  const mimeType = meta.match(/data:(.*?);/)?.[1] || "image/jpeg";
  const prompt = `Identify the packaged food or drink product in this photo of its front packaging.
Respond ONLY with JSON (no markdown): {"brand": string, "productName": string, "variant": string, "category": string, "confidence": "high"|"medium"|"low"}.
"variant" is the flavour/size/variety if visible, else "". "category" is a short generic category like "chocolate bar" or "potato chips".
Do NOT guess or list ingredients. If you cannot identify it, use empty strings and confidence "low".`;
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }, { inline_data: { mime_type: mimeType, data: base64 } }] }],
      }),
    },
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || "Identification failed");
  const out: string = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const json = JSON.parse(out.replace(/```json|```/gi, "").trim().match(/\{[\s\S]*\}/)?.[0] || "{}");
  return {
    brand: String(json.brand || ""),
    productName: String(json.productName || ""),
    variant: String(json.variant || ""),
    category: String(json.category || ""),
    confidence: json.confidence === "high" || json.confidence === "medium" ? json.confidence : "low",
  };
}

async function searchOFF(terms: string, pageSize = 12): Promise<ProductMatch[]> {
  if (!terms.trim()) return [];
  const url =
    `https://world.openfoodfacts.org/cgi/search.pl?search_simple=1&action=process&json=1&page_size=${pageSize}` +
    `&fields=code,product_name,brands,quantity,image_front_small_url,ingredients_text,ingredients_text_en` +
    `&search_terms=${encodeURIComponent(terms)}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return ((data?.products || []) as any[])
      .map((p) => ({
        code: String(p.code || ""),
        name: String(p.product_name || "").trim(),
        brand: String(p.brands || "").split(",")[0].trim(),
        quantity: String(p.quantity || ""),
        image: p.image_front_small_url || null,
        ingredients: String(p.ingredients_text_en || p.ingredients_text || "").trim(),
      }))
      .filter((p) => p.name && p.ingredients);
  } catch {
    return [];
  }
}

const words = (s: string) => s.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2);

function score(p: ProductMatch, id: IdentifiedProduct) {
  const hay = `${p.name} ${p.brand}`.toLowerCase();
  const want = [...words(id.brand), ...words(id.productName), ...words(id.variant)];
  if (!want.length) return 0;
  return want.filter((w) => hay.includes(w)).length / want.length;
}

/** Find the best match; if none is close enough, return similar suggestions (all with recorded ingredients). */
export async function findProduct(id: IdentifiedProduct): Promise<{ match: ProductMatch | null; suggestions: ProductMatch[] }> {
  const full = [id.brand, id.productName, id.variant].filter(Boolean).join(" ");
  const primary = await searchOFF(full);
  const ranked = primary.map((p) => ({ p, s: score(p, id) })).sort((a, b) => b.s - a.s);
  if (ranked[0] && ranked[0].s >= 0.6) return { match: ranked[0].p, suggestions: [] };

  const seen = new Set<string>();
  const suggestions: ProductMatch[] = [];
  const add = (list: ProductMatch[]) => {
    for (const p of list) {
      if (suggestions.length >= 6) return;
      const key = p.code || p.name;
      if (seen.has(key)) continue;
      seen.add(key);
      suggestions.push(p);
    }
  };
  add(ranked.map((r) => r.p));
  const queries = [
    [id.brand, id.productName].filter(Boolean).join(" "),
    id.productName,
    [id.brand, id.category].filter(Boolean).join(" "),
    id.brand,
    id.category,
  ];
  for (const q of queries) {
    if (suggestions.length >= 6) break;
    if (q && q !== full) add(await searchOFF(q));
  }
  return { match: null, suggestions };
}
