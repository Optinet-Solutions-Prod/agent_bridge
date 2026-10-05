import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Pencil, Send } from "lucide-react";
import { deleteRequest, proposeListingForRequest, setRequestStatus } from "@/app/(app)/requests/actions";
import { ListingCard } from "@/components/listing-card";
import { budgetLabel } from "@/components/request-card";
import { SubmitButton } from "@/components/submit-button";
import { AnonBadge, Badge, Button, Card, CardBody, CardTitle, DescriptionList, EmptyState, LinkButton, PageHeader } from "@/components/ui";
import { requireAgent } from "@/lib/auth";
import { formatDate, formatNumber, formatPrice } from "@/lib/format";
import { listingsMatchingRequest } from "@/lib/matching";
import type { BuyerRequestWithAgent, ListingWithAgent } from "@/lib/types";

export const metadata: Metadata = { title: "Buyer request" };

export default async function RequestDetailPage({ params }: PageProps<"/requests/[id]">) {
  const { id } = await params;
  const { supabase, agent } = await requireAgent();

  const { data } = await supabase.from("buyer_requests").select("*, agents(anon_code, verified)").eq("id", id).maybeSingle();
  if (!data) notFound();
  const request = data as BuyerRequestWithAgent;
  const isOwner = request.agent_id === agent.id;

  // Owner sees the network's matching stock; everyone else sees their own matching stock to propose.
  const matches = isOwner
    ? await listingsMatchingRequest(supabase, request, { excludeAgentId: agent.id })
    : ((await listingsMatchingRequest(supabase, request, { limit: 50 })).filter((l) => l.agent_id === agent.id) as ListingWithAgent[]);

  return (
    <>
      <PageHeader
        title={request.title}
        description={
          <span className="flex flex-wrap items-center gap-2">
            Posted {formatDate(request.created_at)}
            <Badge tone={request.status === "active" ? "green" : "amber"}>{request.status}</Badge>
            {isOwner && <Badge tone="blue">Your request</Badge>}
          </span>
        }
        actions={
          isOwner ? (
            <>
              <LinkButton href={`/requests/${request.id}/edit`} variant="secondary">
                <Pencil className="h-4 w-4" /> Edit
              </LinkButton>
              {request.status === "active" ? (
                <form action={setRequestStatus.bind(null, request.id, "fulfilled")}>
                  <Button type="submit" variant="ghost">
                    Mark fulfilled
                  </Button>
                </form>
              ) : (
                <form action={setRequestStatus.bind(null, request.id, "active")}>
                  <Button type="submit" variant="ghost">
                    Reactivate
                  </Button>
                </form>
              )}
            </>
          ) : undefined
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6">
          <Card>
            <CardBody>
              <CardTitle>Brief</CardTitle>
              <DescriptionList
                items={[
                  { label: "Budget", value: budgetLabel(request.min_price, request.max_price) },
                  { label: "Property types", value: request.property_types.length ? request.property_types.join(", ") : "Any" },
                  { label: "Localities", value: request.localities.length ? request.localities.join(", ") : "Anywhere" },
                  { label: "Bedrooms", value: request.min_bedrooms != null ? `${request.min_bedrooms}+` : "Any" },
                  { label: "Internal area", value: request.min_size_sqm != null ? formatNumber(request.min_size_sqm, "+ m²") : "Any" },
                  { label: "Must have", value: request.must_have_features.length ? request.must_have_features.join(", ") : "—" },
                ]}
              />
              {request.notes && <p className="mt-3 whitespace-pre-line text-sm text-slate-700">{request.notes}</p>}
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <CardTitle>Buyer agent</CardTitle>
              <div className="mt-3">{request.agents && <AnonBadge code={request.agents.anon_code} verified={request.agents.verified} prefix="Buyer Agent" />}</div>
              <p className="mt-3 text-xs text-slate-500">
                {isOwner ? "This is how other agents see you on this request." : "Propose a listing to start an anonymous conversation."}
              </p>
            </CardBody>
          </Card>

          {isOwner && (
            <form action={deleteRequest.bind(null, request.id)}>
              <Button type="submit" variant="ghost" className="w-full text-red-600 hover:bg-red-50">
                Delete request
              </Button>
            </form>
          )}
        </div>

        <div className="lg:col-span-2">
          <h2 className="mb-3 text-lg font-semibold">
            {isOwner ? `Matching stock on the network (${matches.length})` : `Your matching inventory (${matches.length})`}
          </h2>

          {matches.length === 0 ? (
            <EmptyState
              title={isOwner ? "No matches yet" : "None of your listings match this brief"}
              description={
                isOwner
                  ? "We'll keep matching as agents add stock. Try widening the budget or localities."
                  : "Add a listing that fits and come back to propose it."
              }
              action={isOwner ? undefined : <LinkButton href="/listings/new">Add a listing</LinkButton>}
            />
          ) : isOwner ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {matches.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          ) : (
            <ul className="space-y-3">
              {matches.map((l) => (
                <li key={l.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{l.title}</p>
                    <p className="text-sm text-slate-600">
                      {formatPrice(l.price, l.currency)} · {l.property_type} · {l.locality}
                      {l.bedrooms != null ? ` · ${l.bedrooms} bed` : ""}
                    </p>
                  </div>
                  <form action={proposeListingForRequest.bind(null, request.id, l.id)}>
                    <SubmitButton variant="secondary" size="sm" pendingText="Opening chat…">
                      <Send className="h-3.5 w-3.5" /> Propose anonymously
                    </SubmitButton>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
