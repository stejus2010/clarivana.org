import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Crown, Infinity, ScanLine, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import {
  cancelMockPremium,
  FREE_AI_LIMIT,
  FREE_SCAN_LIMIT,
  getCurrentPlan,
  openMockPremiumCheckout,
  PREMIUM_PRICE,
  type ClarivanaPlan,
} from "@/lib/premium";

export const Route = createFileRoute("/premium")({
  head: () => ({
    meta: [
      { title: "Clarivana Premium — Unlimited food insights" },
      { name: "description", content: "Explore the Clarivana Premium competition demo with unlimited scans and AI analysis." },
      { property: "og:title", content: "Clarivana Premium — Unlimited food insights" },
      { property: "og:description", content: "Unlimited food-label scans, AI analysis and deeper health insights." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PremiumPage,
});

const BENEFITS = [
  { icon: Infinity, title: "Unlimited scans", body: "Scan as many ingredient labels as you need, every day." },
  { icon: Sparkles, title: "Unlimited AI analysis", body: "Explore health context and ingredient alternatives without daily caps." },
  { icon: ShieldCheck, title: "Deeper insights", body: "Get clearer risk guidance tailored to your saved allergy preferences." },
] as const;

function PremiumPage() {
  const [plan, setPlan] = useState<ClarivanaPlan | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getCurrentPlan().then(setPlan);
  }, []);

  async function upgrade() {
    setBusy(true);
    try {
      if (await openMockPremiumCheckout()) setPlan("premium");
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    setBusy(true);
    try {
      if (await cancelMockPremium()) setPlan("free");
    } finally {
      setBusy(false);
    }
  }

  const premium = plan === "premium";

  return (
    <AppShell>
      <div className="fade-up mx-auto max-w-5xl">
        <div className="text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-primary">
            <Crown className="h-6 w-6" />
          </span>
          <p className="eyebrow mt-4">Clarivana Premium</p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight sm:text-5xl">Know more about every bite.</h1>
          <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
            Remove daily limits and unlock the complete Clarivana food-intelligence experience.
          </p>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-[1fr_1.15fr]">
          <section className="panel p-6">
            <p className="text-sm font-semibold">Free</p>
            <p className="mt-3 text-3xl font-semibold">$0<span className="text-sm font-normal text-muted-foreground"> / month</span></p>
            <div className="mt-6 space-y-3 text-sm text-muted-foreground">
              <p className="flex items-center gap-2"><ScanLine className="h-4 w-4 text-primary-muted" /> {FREE_SCAN_LIMIT} scans each day</p>
              <p className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary-muted" /> {FREE_AI_LIMIT} AI analyses each day</p>
              <p className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> Allergy alerts and scan history</p>
            </div>
            {!premium && <div className="mt-8 rounded-md border border-border bg-background-raised px-4 py-3 text-center text-sm text-muted-foreground">Your current plan</div>}
          </section>

          <section className="relative overflow-hidden rounded-xl border border-primary/50 bg-card p-6 shadow-[var(--glow-primary)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold text-primary-bright"><Crown className="h-4 w-4" /> Premium</p>
                <p className="mt-3 text-4xl font-semibold">{PREMIUM_PRICE}<span className="text-sm font-normal text-muted-foreground"> / month</span></p>
              </div>
              <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase text-primary">Best experience</span>
            </div>
            <div className="mt-6 space-y-3 text-sm">
              {BENEFITS.map((benefit) => (
                <p key={benefit.title} className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> {benefit.title}</p>
              ))}
            </div>
            {premium ? (
              <div className="mt-8">
                <div className="flex items-center gap-2 rounded-md border border-success/40 bg-success/10 px-4 py-3 text-sm font-medium text-success">
                  <ShieldCheck className="h-4 w-4" /> Premium is active
                </div>
                <button disabled={busy} onClick={cancel} className="btn-base btn-ghost mt-3 w-full text-[13px]">End demo subscription</button>
              </div>
            ) : (
              <button disabled={busy || plan === null} onClick={upgrade} className="btn-base btn-primary mt-8 w-full py-3">
                <Crown className="h-4 w-4" /> {busy ? "Opening demo…" : `Try Premium — ${PREMIUM_PRICE}`}
              </button>
            )}
            <p className="mt-3 text-center text-[11px] text-subtle-foreground">Competition demo only. No real payment is processed.</p>
          </section>
        </div>

        <section className="mt-10 grid gap-4 sm:grid-cols-3">
          {BENEFITS.map((benefit) => (
            <div key={benefit.title} className="panel p-5">
              <benefit.icon className="h-5 w-5 text-primary" strokeWidth={1.5} />
              <h2 className="mt-4 text-base font-semibold">{benefit.title}</h2>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{benefit.body}</p>
            </div>
          ))}
        </section>

        <p className="mt-8 text-center text-sm text-muted-foreground">Already happy with Free? <Link to="/scan" className="text-primary hover:underline">Continue scanning</Link></p>
      </div>
    </AppShell>
  );
}