import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RequestForm } from "@/components/request-form";
import { PageHeader } from "@/components/ui";
import { requireAgent } from "@/lib/auth";
import type { BuyerRequest } from "@/lib/types";

export const metadata: Metadata = { title: "Edit buyer request" };

export default async function EditRequestPage({ params }: PageProps<"/requests/[id]/edit">) {
  const { id } = await params;
  const { supabase, agent } = await requireAgent();

  const { data } = await supabase.from("buyer_requests").select("*").eq("id", id).eq("agent_id", agent.id).maybeSingle();
  if (!data) notFound();

  return (
    <>
      <PageHeader title="Edit buyer request" description={data.title} />
      <RequestForm request={data as BuyerRequest} />
    </>
  );
}
