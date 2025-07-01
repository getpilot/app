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
        <Suspense>
            <div className="flex min-h-screen w-full items-center justify-center">
                <SignUpForm />
            </div>
        </Suspense>
    );
}