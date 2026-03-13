import Link from "next/link";
import { SignIn } from "@clerk/nextjs";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-6 py-16">
      <div className="w-full max-w-md">
        <SignIn
          appearance={{
            elements: {
              card: "shadow-panel border border-slate-200",
              headerTitle: "text-slate-950",
              headerSubtitle: "text-slate-500",
              footer: "hidden",
            },
          }}
        />
        <p className="mt-5 text-center text-sm text-slate-600">
          Need an account?
          {" "}
          <Link href="/signup" className="font-semibold text-slate-950 transition hover:text-slate-700">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
