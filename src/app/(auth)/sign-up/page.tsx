import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import SignUpForm from "./sign-up-form";

export default async function SignUpPage() {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    
    if (session?.user) {
        redirect("/dashboard");
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
            <div className="flex min-h-screen w-full items-center justify-center">
                <SignUpForm />
            </div>
        </Suspense>
    );
}