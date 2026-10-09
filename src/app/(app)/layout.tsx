import { AppShell } from "@/components/app-shell";
import { requireAgent } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { agent, user } = await requireAgent();
  return (
    <AppShell agent={agent} email={user.email}>
      {children}
    </AppShell>
  );
}
