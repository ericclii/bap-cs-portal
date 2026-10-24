import type { Metadata } from "next";
import { ServiceHome } from "@/components/service-home";

export const metadata: Metadata = { title: "My service" };

export default function ServicePage() {
  return <ServiceHome />;
}
