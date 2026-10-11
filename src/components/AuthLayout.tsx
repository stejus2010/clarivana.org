import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import logo from "@/assets/logo.png";

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="surface-grid flex min-h-screen items-center justify-center bg-background px-5 py-12">
      <div className="fade-up w-full max-w-md">
        <Link to="/login" className="mb-8 flex items-center justify-center gap-2.5">
          <img src={logo} alt="" className="h-9 w-9 rounded-md object-contain" />
          <span className="text-xl font-semibold tracking-tight">Clarivana</span>
        </Link>
        <div className="panel p-7">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
