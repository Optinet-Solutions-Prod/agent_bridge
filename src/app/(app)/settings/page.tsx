import type { Metadata } from "next";
import { Check, LogOut } from "lucide-react";
import { signOut } from "@/app/auth/actions";
import { IdentityForm } from "@/app/(app)/settings/identity-form";
import { AnonBadge, Badge, Button, Card, CardBody, CardTitle, PageHeader } from "@/components/ui";
import { requireAgent } from "@/lib/auth";
import { PLANS, PLATFORM_FEE_PCT } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import type { AgentIdentity, PlanTier } from "@/lib/types";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { supabase, agent } = await requireAgent();
  const { data } = await supabase.from("agent_identities").select("*").eq("agent_id", agent.id).maybeSingle();
  const identity = data as AgentIdentity | null;

  return (
    <>
      <PageHeader title="Settings" description="Your anonymous identity, private profile and plan." />

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

          <Card>
            <CardBody>
              <CardTitle>Plan</CardTitle>
              <p className="mt-1 text-sm text-slate-600">
                You&apos;re on <strong>{PLANS[agent.plan].name}</strong>. All plans pay the {PLATFORM_FEE_PCT}% success fee on deals closed
                through a Deal Room.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {(Object.keys(PLANS) as PlanTier[]).map((key) => {
                  const plan = PLANS[key];
                  const current = key === agent.plan;
                  return (
                    <div key={key} className={current ? "rounded-xl border-2 border-teal-700 p-4" : "rounded-xl border border-slate-200 p-4"}>
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{plan.name}</p>
                        {current && <Badge tone="teal">Current</Badge>}
                      </div>
                      <p className="mt-1 text-2xl font-semibold">
                        €{plan.priceMonthly}
                        <span className="text-xs font-normal text-slate-500">/mo</span>
                      </p>
                      <ul className="mt-3 space-y-1 text-xs text-slate-600">
                        {plan.perks.slice(0, 3).map((p) => (
                          <li key={p} className="flex gap-1.5">
                            <Check className="mt-0.5 h-3 w-3 shrink-0 text-teal-700" /> {p}
                          </li>
                        ))}
                      </ul>
                      {!current && (
                        <Button variant="secondary" size="sm" className="mt-3 w-full" disabled title="Billing is not connected yet">
                          Upgrade
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 text-xs text-slate-500">
                Billing (Stripe) is not wired up yet — plans are changed manually in the database for now. Update{" "}
                <code className="rounded bg-slate-100 px-1">agents.plan</code> to <code className="rounded bg-slate-100 px-1">pro</code> or{" "}
                <code className="rounded bg-slate-100 px-1">agency</code>.
              </p>
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
