import type { Metadata } from "next";
import { RequestForm } from "@/components/request-form";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "New buyer request" };

export default function NewRequestPage() {
  return (
    <>
      <PageHeader title="Post a buyer request" description="Tell the network what your client wants. Matching listings appear instantly." />
      <RequestForm />
    </>
  );
}
