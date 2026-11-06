import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "BCRP Control Room", template: "%s · BCRP" },
  description: "Beach Coast Roleplay community management dashboard.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
