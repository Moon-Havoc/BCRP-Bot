import {
  Activity,
  Anchor,
  FileText,
  Gauge,
  GitBranch,
  History,
  LifeBuoy,
  Radio,
  Settings2,
  Shield,
  ShipWheel,
  Users,
  Workflow,
  type LucideIcon,
} from "lucide-react";

export type DashboardRoute = {
  href: string;
  label: string;
  icon: LucideIcon;
  group: "Workspace" | "Operations" | "System";
  description?: string;
};

export const dashboardRoutes: DashboardRoute[] = [
  { href: "/", label: "Overview", icon: Gauge, group: "Workspace" },
  { href: "/getting-started", label: "Getting started", icon: Anchor, group: "Workspace" },
  {
    href: "/moderation",
    label: "Moderation",
    icon: Shield,
    group: "Operations",
    description: "Review cases and manage community safety.",
  },
  {
    href: "/tickets",
    label: "Tickets",
    icon: LifeBuoy,
    group: "Operations",
    description: "Support requests and private conversations.",
  },
  {
    href: "/applications",
    label: "Applications",
    icon: FileText,
    group: "Operations",
    description: "Community and department applications.",
  },
  {
    href: "/staff",
    label: "Staff",
    icon: Users,
    group: "Operations",
    description: "Staff records and team access.",
  },
  {
    href: "/departments",
    label: "Departments",
    icon: GitBranch,
    group: "Operations",
    description: "Department structure and rank definitions.",
  },
  {
    href: "/shifts",
    label: "Shifts",
    icon: Activity,
    group: "Operations",
    description: "Shift activity and attendance records.",
  },
  {
    href: "/erlc",
    label: "ER:LC",
    icon: ShipWheel,
    group: "Operations",
    description: "Connect and inspect your ER:LC private server.",
  },
  {
    href: "/sessions",
    label: "Sessions",
    icon: Radio,
    group: "Operations",
    description: "Roleplay session coordination.",
  },
  {
    href: "/dispatch",
    label: "Dispatch",
    icon: Radio,
    group: "Operations",
    description: "Dispatch and incident coordination.",
  },
  {
    href: "/logging",
    label: "Logging",
    icon: History,
    group: "System",
    description: "Audit activity and configured event logs.",
  },
  {
    href: "/automations",
    label: "Automations",
    icon: Workflow,
    group: "System",
    description: "Workflow triggers and actions.",
  },
  {
    href: "/analytics",
    label: "Analytics",
    icon: Activity,
    group: "System",
    description: "Community and staff reporting.",
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings2,
    group: "System",
    description: "Workspace configuration and connections.",
  },
];

export function routeFromPath(path: string): DashboardRoute | undefined {
  return dashboardRoutes.find((route) => route.href === path);
}
