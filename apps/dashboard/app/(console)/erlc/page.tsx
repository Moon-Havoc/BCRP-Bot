import type { Metadata } from "next";
import { routeFromPath } from "@/lib/navigation";
import { SectionPage } from "@/components/section-page";
export const metadata: Metadata = { title: "ER:LC" };
export default function Page() {
  const route = routeFromPath("/erlc");
  return route ? <SectionPage route={route} /> : null;
}
