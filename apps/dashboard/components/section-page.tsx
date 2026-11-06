import Link from "next/link";
import { ArrowRight, CircleDashed, Construction } from "lucide-react";
import type { DashboardRoute } from "@/lib/navigation";

export function SectionPage({ route }: { route: DashboardRoute }) {
  const Icon = route.icon;
  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-7 flex items-start gap-3.5">
        <span className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-md border border-[var(--line)] bg-white text-[var(--coast-700)]">
          <Icon size={19} strokeWidth={1.7} />
        </span>
        <div>
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--coast-700)]">
            {route.group}
          </div>
          <h1 className="text-[25px] font-semibold tracking-[-0.035em] text-[var(--navy-950)]">
            {route.label}
          </h1>
          <p className="mt-1.5 max-w-xl text-[13px] leading-5 text-[var(--muted)]">
            {route.description}
          </p>
        </div>
      </div>

      <section className="overflow-hidden rounded-lg border border-[var(--line)] bg-white">
        <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-3.5">
          <h2 className="text-[12px] font-semibold text-[var(--ink)]">Workspace status</h2>
          <span className="inline-flex items-center gap-1.5 rounded-sm bg-[#f5f1e8] px-2 py-1 text-[10px] font-medium text-[#7b6134]">
            <CircleDashed size={12} /> Not configured
          </span>
        </div>
        <div className="grid gap-6 p-5 sm:grid-cols-[minmax(0,1fr)_220px] sm:p-7">
          <div className="max-w-xl">
            <div className="mb-4 grid size-10 place-items-center rounded-full bg-[var(--coast-100)] text-[var(--coast-700)]">
              <Construction size={19} strokeWidth={1.7} />
            </div>
            <h3 className="text-[17px] font-semibold tracking-[-0.02em] text-[var(--navy-950)]">
              This area is being prepared
            </h3>
            <p className="mt-2 text-[13px] leading-6 text-[var(--muted)]">
              {route.label} tools are not connected yet. This foundation keeps the workspace honest
              while the BCRP platform is being built. No actions are available here at this stage.
            </p>
          </div>
          <div className="rounded-md border border-[var(--line)] bg-[var(--shell)] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[var(--muted)]">
              Next step
            </p>
            <p className="mt-2 text-[13px] leading-5 text-[var(--ink)]">
              Review setup requirements before this module is configured.
            </p>
            <Link
              href="/getting-started"
              className="focus-ring mt-4 inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--coast-700)] hover:text-[var(--navy-950)]"
            >
              Getting started <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
