"use client"

import type React from "react";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { FloatingPaths } from "@/components/floating-paths";
import { AtSignIcon, LockIcon, Loader2 } from "lucide-react";
import { useState } from "react";
import { signIn, signUp } from "@/lib/auth-client";
import { Icons } from "@/components/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AuthCard({
  mode = "sign-in",
}: {
  mode?: "sign-in" | "sign-up";
}) {
  const router = useRouter();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setEmailLoading(true);

    try {
      if (mode === "sign-up") {
        const res = await signUp.email({
          email,
          password,
          name: name || email.split("@")[0],
        });
        if (res.error) {
          setError(res.error.message ?? "Sign up failed");
        } else {
          router.push("/");
        }
      } else {
        const res = await signIn.email({
          email,
          password,
        });
        if (res.error) {
          setError(res.error.message ?? "Sign in failed");
        } else {
          router.push("/");
        }
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setEmailLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    await signIn.social(
      {
        provider: "google",
        callbackURL: "/",
      },
      {
        onRequest: () => {
          setGoogleLoading(true);
        },
      },
    );
  };

  const decorationColumn = (
    <div className="relative hidden h-full flex-col border-r bg-secondary p-10 lg:flex dark:bg-secondary/20">
      <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-background" />
      {/* <div className="z-10 mt-auto">
        <blockquote className="space-y-2">
          <p className="text-xl">
            &ldquo;This Platform has helped me to save time and serve my
            clients faster than ever before.&rdquo;
          </p>
          <footer className="font-mono font-semibold text-sm">
            ~ Ali Hassan
          </footer>
        </blockquote>
      </div> */}
      <div className="absolute inset-0">
        <FloatingPaths position={1} />
        <FloatingPaths position={-1} />
      </div>
    </div>
  );

  const formColumn = (
    <div className="relative flex min-h-screen flex-col justify-center px-8">
      {/* Top Shades */}
      <div
        aria-hidden
        className="absolute inset-0 isolate -z-10 opacity-60 contain-strict"
      >
        <div className="absolute top-0 right-0 h-320 w-140 -translate-y-87.5 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,--theme(--color-foreground/.06)_0,hsla(0,0%,55%,.02)_50%,--theme(--color-foreground/.01)_80%)]" />
        <div className="absolute top-0 right-0 h-320 w-60 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)] [translate:5%_-50%]" />
        <div className="absolute top-0 right-0 h-320 w-60 -translate-y-87.5 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)]" />
      </div>

      <div className="mx-auto space-y-4 sm:w-sm">
        <Icons.Logo className="h-4.5 lg:hidden" />
        <div className="flex flex-col space-y-1">
          <h1 className="font-heading font-bold text-2xl tracking-wide">
            {mode === "sign-in" ? "Welcome Back" : "Create Account"}
          </h1>
          <p className="text-base text-muted-foreground">
            {mode === "sign-in"
              ? "Sign in to your account to continue."
              : "Create your account to get started."}
          </p>
        </div>

        {/* Google sign in */}
        <div className="space-y-2">
          <Button
            className="w-full"
            disabled={googleLoading}
            onClick={handleGoogleSignIn}
          >
            {googleLoading ? (
              <Loader2 className="size-4 animate-spin" data-icon="inline-start" />
            ) : (
              <Icons.Google className="size-4" data-icon="inline-start" />
            )}
            Continue with Google
          </Button>
        </div>

        <div className="flex w-full items-center justify-center">
          <div className="h-px w-full bg-border" />
          <span className="px-2 text-muted-foreground text-xs">OR</span>
          <div className="h-px w-full bg-border" />
        </div>

        <form className="space-y-2" onSubmit={handleEmailAuth}>
          <p className="text-start text-muted-foreground text-xs">
            {mode === "sign-in"
              ? "Enter your email and password to sign in"
              : "Enter your details to create an account"}
          </p>

          {mode === "sign-up" && (
            <InputGroup>
              <InputGroupInput
                placeholder="Your name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <InputGroupAddon align="inline-start">
                <AtSignIcon />
              </InputGroupAddon>
            </InputGroup>
          )}

          <InputGroup>
            <InputGroupInput
              placeholder="your.email@example.com"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <InputGroupAddon align="inline-start">
              <AtSignIcon />
            </InputGroupAddon>
          </InputGroup>

          <InputGroup>
            <InputGroupInput
              placeholder="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <InputGroupAddon align="inline-start">
              <LockIcon />
            </InputGroupAddon>
          </InputGroup>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button className="w-full" type="submit" disabled={emailLoading}>
            {emailLoading && <Loader2 className="size-4 animate-spin" data-icon="inline-start" />}
            {mode === "sign-in" ? "Sign In" : "Create Account"}
          </Button>
        </form>

        {/* Footer links */}
        <div className="space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            {mode === "sign-in" ? (
              <>
                Don&apos;t have an account?{" "}
                <Link href="/sign-up" className="text-primary font-medium hover:underline">
                  Sign up
                </Link>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <Link href="/sign-in" className="text-primary font-medium hover:underline">
                  Sign in
                </Link>
              </>
            )}
          </p>
          {/* <p className="text-muted-foreground text-sm">
            By clicking continue, you agree to our{" "}
            <a
              className="underline underline-offset-4 hover:text-primary"
              href="#"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              className="underline underline-offset-4 hover:text-primary"
              href="#"
            >
              Privacy Policy
            </a>
            .
          </p> */}
        </div>
      </div>
    </div>
  );

  return (
    <main className="relative md:h-screen md:overflow-hidden lg:grid lg:grid-cols-2">
      {mode === "sign-in" ? (
        <>
          {decorationColumn}
          {formColumn}
        </>
      ) : (
        <>
          {formColumn}
          {decorationColumn}
        </>
      )}
    </main>
  );
}
