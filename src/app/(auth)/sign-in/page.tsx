import { Suspense } from "react";
import { getUser } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import SignInForm from "./sign-in-form";

export default async function SignInPage() {
  const user = await getUser();

  if (user) {
    redirect("/");
  }

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen w-full items-center justify-center">
          <div className="animate-pulse flex flex-col items-center gap-4">
            <div className="h-12 w-48 bg-muted rounded"></div>
            <div className="h-8 w-32 bg-muted rounded"></div>
          </div>
        </div>
      }
    >
      <div className="flex min-h-screen w-full items-center justify-center">
        <SignInForm />
      </div>
    </Suspense>
  );
}