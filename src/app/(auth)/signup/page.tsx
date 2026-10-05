import type { Metadata } from "next";
import Link from "next/link";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "Create agent profile" };

export default function SignupPage() {
  return (
    <>
      <h1 className="text-xl font-semibold">Join the network</h1>
      <p className="mt-1 text-sm text-slate-600">
        Your name and agency are stored privately and only shown to a counterparty after a Deal Room is agreed. Everyone else
        sees you as <span className="font-mono">Agent #MT…</span>
      </p>
      <div className="mt-6">
        <SignupForm />
      </div>
      <p className="mt-6 text-center text-sm text-slate-600">
        Already have a profile?{" "}
        <Link href="/login" className="font-medium text-teal-700 hover:underline">
          Log in
        </Link>
      </p>
    </>
  );
}
