import Link from "next/link";
import { ArrowRight, Anchor, Compass, ShieldCheck, Waves } from "lucide-react";
import { dashboardRoutes } from "@/lib/navigation";

const quickLinks = ["/moderation", "/tickets", "/staff", "/erlc"];

export default function OverviewPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <section className="coastline relative overflow-hidden rounded-lg bg-[var(--navy-950)] px-6 py-7 text-white sm:px-9 sm:py-9">
        <div className="relative z-10 max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-sm border border-white/15 bg-white/[0.07] px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.13em] text-[#c4d9e3]">
            <Waves size={13} /> Community operations
          </div>
          <h1 className="text-[28px] font-semibold tracking-[-0.04em] sm:text-[34px]">
            Welcome to the BCRP
            <br className="hidden sm:block" /> Control Room
          </h1>
          <p className="mt-3 max-w-xl text-[13px] leading-6 text-[#c0ccd5]">
            A single place for Beach Coast Roleplay operations. The platform foundation is in setup;
            connect services and configure your workspace before using community tools.
          </p>
          <Link
            href="/getting-started"
            className="focus-ring mt-6 inline-flex min-h-10 items-center gap-2 rounded-md bg-[#edf3f5] px-4 text-[12px] font-semibold text-[var(--navy-950)] transition-colors hover:bg-white"
          >
            Review setup <ArrowRight size={15} />
          </Link>
        </div>
        <div
          aria-hidden="true"
          className="absolute -right-8 -top-8 hidden h-[280px] w-[340px] opacity-70 md:block"
        >
          <div className="absolute inset-0 rounded-full border border-white/10" />
          <div className="absolute inset-7 rounded-full border border-white/10" />
          <div className="absolute inset-14 rounded-full border border-white/10" />
          <div className="absolute inset-[88px] rounded-full border border-white/10" />
          <span className="absolute right-24 top-20 grid size-12 place-items-center rounded-full border border-white/15 bg-white/[0.06] text-[#c4d9e3]">
            <Compass size={23} strokeWidth={1.4} />
          </span>
        </div>
      </section>

      <div className="mt-5 grid gap-4 md:grid-cols-[1.35fr_1fr]">
        <section className="rounded-lg border border-[var(--line)] bg-white p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-md bg-[var(--coast-100)] text-[var(--coast-700)]">
              <Anchor size={17} />
            </span>
            <div>
              <h2 className="text-[14px] font-semibold text-[var(--navy-950)]">Workspace setup</h2>
              <p className="mt-1 text-[13px] leading-5 text-[var(--muted)]">
                The dashboard shell is available. Bot, API, database and Discord account connections
                still need local configuration.
              </p>
            </div>
          </div>
          <div className="mt-5 border-t border-[var(--line)] pt-4">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-medium text-[var(--ink)]">Current state</span>
              <span className="inline-flex items-center gap-1.5 text-[#805f2a]">
                <span className="size-1.5 rounded-full bg-[#b58a48]" /> Foundation only
              </span>
            </div>
            <Link
              href="/getting-started"
              className="focus-ring mt-4 inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--coast-700)] hover:text-[var(--navy-950)]"
            >
              View setup guide <ArrowRight size={14} />
            </Link>
          </div>
        </section>
        <section className="rounded-lg border border-[var(--line)] bg-white p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-md bg-[#eef1f3] text-[var(--coast-700)]">
              <ShieldCheck size={17} />
            </span>
            <div>
              <h2 className="text-[14px] font-semibold text-[var(--navy-950)]">
                A note about feature status
              </h2>
              <p className="mt-1 text-[13px] leading-5 text-[var(--muted)]">
                Module screens are navigation and status surfaces only. Nothing here takes action on
                Discord or ER:LC yet.
              </p>
            </div>
          </div>
          <p className="mt-4 border-t border-[var(--line)] pt-4 text-[12px] leading-5 text-[var(--muted)]">
            Credentials belong in local environment variables and must never be added to browser
            code or committed files.
          </p>
        </section>
      </div>

      <section className="mt-8">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--coast-700)]">
              Platform areas
            </p>
            <h2 className="mt-1 text-[17px] font-semibold tracking-[-0.02em] text-[var(--navy-950)]">
              Your workspace
            </h2>
          </div>
          <span className="text-[11px] text-[var(--muted)]">Modules are not configured</span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {quickLinks.map((href) => {
            const item = dashboardRoutes.find((route) => route.href === href);
            if (!item) return null;
            const Icon = item.icon;
            return (
              <Link
                key={href}
                href={href}
                className="focus-ring group flex items-center gap-3 rounded-md border border-[var(--line)] bg-white p-3.5 transition-colors hover:border-[#b9cbd5] hover:bg-[#fbfcfc]"
              >
                <span className="grid size-8 place-items-center rounded bg-[var(--shell)] text-[var(--coast-700)] group-hover:bg-[var(--coast-100)]">
                  <Icon size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[12px] font-semibold text-[var(--ink)]">
                    {item.label}
                  </span>
                  <span className="mt-0.5 block truncate text-[11px] text-[var(--muted)]">
                    {item.description}
                  </span>
                </span>
                <ArrowRight
                  size={14}
                  className="text-[#91a0ac] transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
