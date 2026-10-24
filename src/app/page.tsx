import { redirect } from "next/navigation";
import { ServiceHome } from "@/components/service-home";
import { getCurrentUser } from "@/server/session";

/** Committee members open to the committee; everyone else to their own service. */
export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  if (user.role) redirect("/committee");
  return <ServiceHome />;
}
