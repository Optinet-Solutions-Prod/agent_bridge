import { AppShell } from "@/components/app-shell";
import { requireAgent } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { agent } = await requireAgent();
  return <AppShell agent={agent}>{children}</AppShell>;
}
