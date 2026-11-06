import type { Metadata } from "next";
import { routeFromPath } from "@/lib/navigation";
import { SectionPage } from "@/components/section-page";
export const metadata: Metadata = { title: "Shifts" };
export default function Page() {
  const route = routeFromPath("/shifts");
  return route ? <SectionPage route={route} /> : null;
}
