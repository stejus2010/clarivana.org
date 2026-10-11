// Gemini configuration — unchanged from the original Clarivana app.
export const GEMINI_API_KEY = "AQ.Ab8RN6KIhHF2GkLw6OJtKzZ28fq9Gc2Jjo7Qj_0hhXdDvW-Rxw";
export const MODEL = "gemini-2.5-flash";

export async function generateContent(prompt: string) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] }),
    },
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || "Request failed");
  return (data?.candidates?.[0]?.content?.parts?.[0]?.text as string) || "";
}
