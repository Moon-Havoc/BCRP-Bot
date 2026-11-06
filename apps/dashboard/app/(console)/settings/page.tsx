import type { Metadata } from "next";
import { routeFromPath } from "@/lib/navigation";
import { SectionPage } from "@/components/section-page";
export const metadata: Metadata = { title: "Settings" };
export default function Page() {
  const route = routeFromPath("/settings");
  return route ? <SectionPage route={route} /> : null;
}
