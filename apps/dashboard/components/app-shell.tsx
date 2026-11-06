"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Anchor, Menu, Waves, X } from "lucide-react";
import { dashboardRoutes, type DashboardRoute } from "@/lib/navigation";

function SidebarLink({ route, onNavigate }: { route: DashboardRoute; onNavigate?: () => void }) {
  const pathname = usePathname();
  const active =
    route.href === "/"
      ? pathname === "/"
      : pathname === route.href || pathname.startsWith(`${route.href}/`);
  const Icon = route.icon;

  return (
    <Link
      href={route.href}
      {...(onNavigate ? { onClick: onNavigate } : {})}
      aria-current={active ? "page" : undefined}
      className={`group flex min-h-9 items-center gap-3 rounded-md px-3 text-[13px] font-medium transition-colors focus-ring ${active ? "bg-[#233e5b] text-white" : "text-[#b5c3cf] hover:bg-white/[0.07] hover:text-white"}`}
    >
      <Icon
        aria-hidden="true"
        size={16}
        strokeWidth={1.8}
        className={active ? "text-[#c4d9e3]" : "text-[#8299aa] group-hover:text-[#c4d9e3]"}
      />
      <span>{route.label}</span>
      {route.href === "/getting-started" && (
        <span className="ml-auto rounded bg-[#f1e6ce] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#785320]">
          Setup
        </span>
      )}
    </Link>
  );
}

function Navigation({ onNavigate }: { onNavigate?: () => void }) {
  const groups = ["Workspace", "Operations", "System"] as const;
  return (
    <nav aria-label="Main navigation" className="space-y-5">
      {groups.map((group) => (
        <section key={group} aria-label={group}>
          <h2 className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7f95a7]">
            {group}
          </h2>
          <div className="space-y-0.5">
            {dashboardRoutes
              .filter((route) => route.group === group)
              .map((route) => (
                <SidebarLink
                  key={route.href}
                  route={route}
                  {...(onNavigate ? { onNavigate } : {})}
                />
              ))}
          </div>
        </section>
      ))}
    </nav>
  );
}

function SidebarBrand() {
  return (
    <Link
      href="/"
      className="focus-ring flex items-center gap-3 rounded-md"
      aria-label="BCRP Control Room home"
    >
      <span className="grid size-9 place-items-center rounded-md border border-white/10 bg-[#1c3b5b] text-[#d5e4eb]">
        <Waves size={19} strokeWidth={1.7} />
      </span>
      <span>
        <span className="block text-[14px] font-semibold tracking-[0.08em] text-white">BCRP</span>
        <span className="mt-0.5 block text-[10px] tracking-[0.04em] text-[#8fa3b3]">
          CONTROL ROOM
        </span>
      </span>
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  return (
    <div className="min-h-screen bg-[var(--shell)]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[246px] flex-col bg-[var(--navy-950)] text-white lg:flex">
        <div className="border-b border-white/[0.09] px-5 py-5">
          <SidebarBrand />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-5">
          <Navigation />
        </div>
        <div className="border-t border-white/[0.09] px-5 py-4">
          <p className="text-[11px] font-medium text-[#d4dee5]">Beach Coast Roleplay</p>
          <p className="mt-1 text-[12px] text-[#a6b5c0]">Community workspace · setup</p>
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex h-[58px] items-center justify-between border-b border-[var(--line)] bg-white/95 px-4 backdrop-blur-sm lg:ml-[246px] lg:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label={mobileNavOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={mobileNavOpen}
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="focus-ring grid size-9 place-items-center rounded-md text-[var(--ink)] hover:bg-[var(--shell)] lg:hidden"
          >
            {mobileNavOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
          <span className="hidden items-center gap-2 text-[12px] text-[var(--muted)] sm:flex">
            <Anchor size={14} className="text-[var(--coast-600)]" /> Community workspace
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-md border border-[#eadfc8] bg-[#fbf7ef] px-2.5 py-1.5 text-[10px] font-medium uppercase tracking-[0.1em] text-[#795b2a]">
          <span className="size-1.5 rounded-full bg-[#b58a48]" />
          Setup mode
        </div>
      </header>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 cursor-default bg-[#0b1827]/50"
            aria-label="Close navigation overlay"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="relative flex h-full w-[280px] flex-col bg-[var(--navy-950)] text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.09] px-5 py-5">
              <SidebarBrand />
              <button
                type="button"
                aria-label="Close navigation"
                onClick={() => setMobileNavOpen(false)}
                className="focus-ring grid size-8 place-items-center rounded text-[#b5c3cf] hover:bg-white/10"
              >
                <X size={17} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-5">
              <Navigation onNavigate={() => setMobileNavOpen(false)} />
            </div>
            <div className="border-t border-white/[0.09] px-5 py-4 text-[12px] text-[#a6b5c0]">
              Beach Coast Roleplay
            </div>
          </aside>
        </div>
      )}

      <main id="main-content" className="min-h-[calc(100vh-58px)] lg:ml-[246px]">
        <div className="mx-auto w-full max-w-[1440px] px-4 py-7 sm:px-6 lg:px-9 lg:py-9">
          {children}
        </div>
      </main>
    </div>
  );
}
