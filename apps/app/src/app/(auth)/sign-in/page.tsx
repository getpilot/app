import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import SignInForm from "./sign-in-form";

export default async function SignInPage() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (session?.user) {
        redirect("/");
    }

    return (
        <Suspense fallback={
            <div className="flex min-h-screen w-full items-center justify-center">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="h-12 w-48 bg-muted rounded"></div>
                    <div className="h-8 w-32 bg-muted rounded"></div>
                </div>
            </div>
        }>
            <SignInForm />
        </Suspense>
    );
}