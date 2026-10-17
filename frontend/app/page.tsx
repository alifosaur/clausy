import type { Metadata } from "next";
import HomeClient from "./HomeClient";

export const metadata: Metadata = {
  title: "Clausy — Know What You're Signing",
  description:
    "Clausy reads your rental agreement, shows the exact clause behind every answer, and tells you when the document doesn't say.",
  alternates: {
    canonical: "/",
  },
};

export default function HomePage() {
  return <HomeClient />;
}
