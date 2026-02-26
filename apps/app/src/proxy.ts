import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

const protectedRoutes = ["/(dashboard)"];
const authRoutes = ["/sign-in", "/sign-up"];

export async function proxy(request: NextRequest) {
    const session = await auth.api.getSession({
        headers: await headers()
    })
    
    const { pathname } = request.nextUrl;

    // Allow Inngest webhook/handler endpoints without auth
    if (pathname.startsWith("/api/inngest")) {
        return NextResponse.next();
    }
    
    // If user is not authenticated and trying to access protected route
    if (!session && protectedRoutes.some(route => pathname.startsWith(route))) {
        return NextResponse.redirect(new URL("/sign-in", request.url));
    }
    
    // If user is authenticated but trying to access auth routes
    if (session && authRoutes.some(route => pathname.startsWith(route))) {
        return NextResponse.redirect(new URL("/", request.url));
    }
 
    return NextResponse.next();
}

export const config = {
    matcher: [
      '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
      '/(api|trpc)(.*)',
    ]
};
