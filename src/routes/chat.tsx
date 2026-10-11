import { createFileRoute } from "@tanstack/react-router";
import { Send, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { generateContent } from "@/lib/gemini";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "AI Assistant — Clarivana" },
      { name: "description", content: "Ask Clarivana's AI assistant anything about ingredients and nutrition." },
      { property: "og:title", content: "AI Assistant — Clarivana" },
      { property: "og:description", content: "Quick answers about ingredients and nutrition." },
    ],
  }),
  component: ChatPage,
});

const WORD_LIMIT = 50;
type Msg = { text: string; sender: "user" | "bot"; temp?: boolean };

function ChatPage() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight });
  }, [msgs]);

  async function send() {
    const text = input.trim();
    if (!text) return;
    setInput("");
    setMsgs((m) => [...m, { text, sender: "user" }, { text: "Thinking...", sender: "bot", temp: true }]);
    let reply: string;
    try {
      reply = (await generateContent(`Please answer in under ${WORD_LIMIT} words. ${text}`)) || "Sorry, I couldn’t process that.";
    } catch (err) {
      console.error(err);
      reply = "⚠️ Network error or invalid API key.";
    }
    setMsgs((m) => [...m.filter((x) => !x.temp), { text: reply, sender: "bot" }]);
  }

  return (
    <AppShell>
      <div className="fade-up mx-auto flex max-w-3xl flex-col">
        <p className="eyebrow">Clarivana AI</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Assistant</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Ask anything about ingredients, additives or nutrition.</p>

        <div ref={boxRef} className="panel mt-6 h-[55vh] space-y-3 overflow-y-auto p-5">
          {msgs.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
              <Sparkles className="h-6 w-6 text-primary" strokeWidth={1.5} />
              <p className="mt-3 text-sm">Try “Is E621 safe for kids?”</p>
            </div>
          )}
          {msgs.map((m, i) => (
            <div key={i} className={m.sender === "user" ? "flex justify-end" : "flex justify-start"}>
              <div
                className={
                  m.sender === "user"
                    ? "max-w-[80%] rounded-xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground"
                    : `max-w-[80%] whitespace-pre-wrap rounded-xl rounded-bl-sm border border-border bg-card-raised px-4 py-2.5 text-sm ${m.temp ? "animate-pulse text-muted-foreground" : ""}`
                }
              >
                {m.text}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 flex gap-2">
          <input
            className="field flex-1"
            placeholder="Ask a question…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
          />
          <button onClick={send} className="btn-base btn-primary px-4" aria-label="Send">
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </AppShell>
  );
}
