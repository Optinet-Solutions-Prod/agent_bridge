import type { Metadata } from "next";
import { LogOut } from "lucide-react";
import { signOut } from "@/app/auth/actions";
import { IdentityForm } from "@/app/(app)/settings/identity-form";
import { AnonBadge, Button, Card, CardBody, CardTitle, PageHeader } from "@/components/ui";
import { requireAgent } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import type { AgentIdentity } from "@/lib/types";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { supabase, agent } = await requireAgent();
  const { data } = await supabase.from("agent_identities").select("*").eq("agent_id", agent.id).maybeSingle();
  const identity = data as AgentIdentity | null;

  return (
    <>
      <PageHeader title="Settings" description="Your anonymous identity and private profile." />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardBody>
              <CardTitle>Private profile</CardTitle>
              <p className="mt-1 mb-4 text-sm text-slate-600">
                Stored in a separate table protected by row-level security. Other agents cannot read any of it until you both
                accept a Deal Room.
              </p>
              <IdentityForm identity={identity} />
            </CardBody>
          </Card>

        </div>

        <div className="space-y-6">
          <Card>
            <CardBody>
              <CardTitle>Your anonymous identity</CardTitle>
              <div className="mt-3">
                <AnonBadge code={agent.anon_code} verified={agent.verified} />
              </div>
              <p className="mt-3 text-sm text-slate-600">This is all other agents see of you across listings, requests, chat and pending Deal Rooms.</p>
              <dl className="mt-4 space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Verified</dt>
                  <dd>{agent.verified ? "Yes" : "Pending review"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Member since</dt>
                  <dd>{formatDate(agent.created_at)}</dd>
                </div>
              </dl>
            </CardBody>
          </Card>

          <form action={signOut}>
            <Button type="submit" variant="secondary" className="w-full">
              <LogOut className="h-4 w-4" /> Log out
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}
