import type { Metadata } from "next";
import { routeFromPath } from "@/lib/navigation";
import { SectionPage } from "@/components/section-page";
export const metadata: Metadata = { title: "Dispatch" };
export default function Page() {
  const route = routeFromPath("/dispatch");
  return route ? <SectionPage route={route} /> : null;
}
