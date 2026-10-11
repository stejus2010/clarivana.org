import { createFileRoute, Link } from "@tanstack/react-router";
import { ScanLine, BookOpen, UserCog, Compass, ArrowRight } from "lucide-react";
import heroImage from "@/assets/hero-product.jpg";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Clarivana — Know what's really in your food" },
      {
        name: "description",
        content:
          "Scan packaged food labels, understand ingredients, get personalised insights and discover better alternatives.",
      },
      { property: "og:title", content: "Clarivana — Know what's really in your food" },
      {
        property: "og:description",
        content: "Scan food labels and understand every ingredient in seconds.",
      },
    ],
  }),
  component: HomePage,
});

const FEATURES = [
  { icon: ScanLine, title: "Scan", body: "Upload or take a photo of the ingredient label.", to: "/scan" },
  { icon: BookOpen, title: "Understand", body: "Get clear, simple explanations.", to: "/chat" },
  { icon: UserCog, title: "Personalize", body: "See what matters for your health needs.", to: "/allergies" },
  { icon: Compass, title: "Discover", body: "Review past scans and safer choices.", to: "/history" },
] as const;

function HomePage() {
  return (
    <AppShell>
      <section className="fade-up grid items-center gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
        <div>
          <p className="eyebrow">AI-powered food label intelligence</p>
          <h1 className="mt-4 text-[clamp(2.5rem,6vw,4rem)] font-semibold leading-[1.05] tracking-[-0.03em]">
            Know
            <br />
            what&rsquo;s <span className="text-primary">really</span>
            <br />
            in your food.
          </h1>
          <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-muted-foreground">
            Scan packaged food labels, understand ingredients, get personalized insights and
            discover healthier alternatives.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/scan" className="btn-base btn-primary px-5 py-3">
              Scan a product
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/allergies" className="btn-base btn-outline px-5 py-3">
              My allergies
            </Link>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-border">
          <img
            src={heroImage}
            alt="Packaged snack product ready to scan"
            width={1200}
            height={1008}
            className="h-full w-full object-cover"
          />
          <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-background via-transparent to-transparent" />
          <div className="scan-sweep pointer-events-none absolute inset-0" />
          <div className="absolute bottom-4 left-4 rounded-lg border border-border bg-background-deep/85 px-3 py-2 backdrop-blur-sm">
            <p className="text-[11px] uppercase tracking-[0.12em] text-subtle-foreground">
              From ingredient lists
            </p>
            <p className="text-sm text-primary-bright">to real insights</p>
          </div>
        </div>
      </section>

      <section className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f) => {
          const Icon = f.icon;
          return (
            <Link key={f.title} to={f.to} className="panel panel-hover block p-5">
              <Icon className="h-5 w-5 text-primary" strokeWidth={1.5} />
              <h2 className="mt-4 text-base font-medium">{f.title}</h2>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{f.body}</p>
            </Link>
          );
        })}
      </section>
    </AppShell>
  );
}
