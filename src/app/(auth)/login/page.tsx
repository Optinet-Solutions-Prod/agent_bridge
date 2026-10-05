import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : "/dashboard";
  const authError = params.error === "auth";

  return (
    <>
      <h1 className="text-xl font-semibold">Welcome back</h1>
      <p className="mt-1 text-sm text-slate-600">Log in to your anonymous agent profile.</p>
      {authError && (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          That confirmation link has expired or was already used. Try logging in.
        </p>
      )}
      <div className="mt-6">
        <LoginForm next={next} />
      </div>
      <p className="mt-6 text-center text-sm text-slate-600">
        New to the network?{" "}
        <Link href="/signup" className="font-medium text-teal-700 hover:underline">
          Create an agent profile
        </Link>
      </p>
    </>
  );
}
