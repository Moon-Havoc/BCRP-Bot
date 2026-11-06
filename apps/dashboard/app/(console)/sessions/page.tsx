import type { Metadata } from "next";
import { routeFromPath } from "@/lib/navigation";
import { SectionPage } from "@/components/section-page";
export const metadata: Metadata = { title: "Sessions" };
export default function Page() {
  const route = routeFromPath("/sessions");
  return route ? <SectionPage route={route} /> : null;
}
