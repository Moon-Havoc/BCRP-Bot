import type { Metadata } from "next";
import {
  AlertCircle,
  CheckCircle2,
  Circle,
  Database,
  KeyRound,
  RadioTower,
  Server,
} from "lucide-react";

export const metadata: Metadata = { title: "Getting started" };

const requirements = [
  {
    title: "Install the project dependencies",
    detail: "Use pnpm from the repository root after the workspace is initialized.",
    icon: Server,
    state: "Foundation",
  },
  {
    title: "Configure local environment",
    detail: "Copy .env.example to .env.local and fill only the values available to you.",
    icon: KeyRound,
    state: "Not configured",
  },
  {
    title: "Start PostgreSQL and apply migrations",
    detail:
      "The schema can be generated locally, but application data requires a running PostgreSQL instance.",
    icon: Database,
    state: "Not configured",
  },
  {
    title: "Connect the Discord bot",
    detail:
      "Requires your own Discord application credentials and an invited bot. No credentials are stored in this dashboard.",
    icon: RadioTower,
    state: "Not configured",
  },
];

export default function GettingStartedPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-7">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--coast-700)]">
          Workspace
        </p>
        <h1 className="text-[25px] font-semibold tracking-[-0.035em] text-[var(--navy-950)]">
          Getting started
        </h1>
        <p className="mt-1.5 max-w-xl text-[13px] leading-5 text-[var(--muted)]">
          Prepare a local BCRP development environment. This dashboard does not connect accounts or
          services yet.
        </p>
      </div>
      <div className="mb-5 flex gap-3 rounded-md border border-[#ebdfc9] bg-[#fbf7ef] p-4 text-[12px] leading-5 text-[#655334]">
        <AlertCircle size={17} className="mt-0.5 shrink-0 text-[#9c753d]" />
        <p>
          <strong className="font-semibold">No services are connected.</strong> The bot, API and
          database must be started separately from your terminal. A green status here would be
          misleading until each service has a real health check.
        </p>
      </div>
      <section className="overflow-hidden rounded-lg border border-[var(--line)] bg-white">
        <div className="border-b border-[var(--line)] px-5 py-4">
          <h2 className="text-[13px] font-semibold text-[var(--ink)]">Local setup checklist</h2>
          <p className="mt-1 text-[12px] text-[var(--muted)]">
            Follow the README from the repository root for commands.
          </p>
        </div>
        <ol className="divide-y divide-[var(--line)]">
          {requirements.map((item, index) => {
            const Icon = item.icon;
            const complete = item.state === "Foundation";
            return (
              <li key={item.title} className="flex gap-3.5 px-5 py-4">
                <span className="mt-0.5 text-[var(--coast-700)]">
                  {complete ? (
                    <CheckCircle2 size={17} />
                  ) : (
                    <Circle size={17} className="text-[#aab5be]" />
                  )}
                </span>
                <span className="grid size-8 shrink-0 place-items-center rounded bg-[var(--shell)] text-[var(--coast-700)]">
                  <Icon size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-[12px] font-semibold text-[var(--ink)]">
                      {index + 1}. {item.title}
                    </h3>
                    <span
                      className={`text-[11px] ${complete ? "text-[#507466]" : "text-[var(--muted)]"}`}
                    >
                      {item.state}
                    </span>
                  </div>
                  <p className="mt-1 text-[12px] leading-5 text-[var(--muted)]">{item.detail}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>
      <p className="mt-4 text-[12px] text-[var(--muted)]">
        Never paste bot tokens, OAuth secrets, database credentials or the ER:LC server key into a
        chat or source file.
      </p>
    </div>
  );
}
