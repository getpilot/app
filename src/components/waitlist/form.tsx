"use client";
import clsx from "clsx";
import type React from "react";

import { useRef, useState, useEffect } from "react";

type InputForm = {
  formAction?: (
    data: FormData
  ) => Promise<{ success: true } | { success: false; error: string }>;
  buttonCopy: {
    success: string;
    idle: string;
    loading: string;
  };
} & React.HTMLAttributes<HTMLInputElement>;

type State = "idle" | "loading" | "success" | "error";

const STATES: Record<State, State> = {
  idle: "idle",
  loading: "loading",
  success: "success",
  error: "error",
};

export function InputForm({ formAction, buttonCopy, ...props }: InputForm) {
  const [state, setState] = useState<State>(STATES.idle);
  const [error, setError] = useState<string>();
  const [emailValue, setEmailValue] = useState("");
  const [nameValue, setNameValue] = useState("");
  const errorTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (state === STATES.success) {
      const resetTimeout = setTimeout(() => {
        setState(STATES.idle);
      }, 2000);

      return () => clearTimeout(resetTimeout);
    }
  }, [state]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formEl = e.currentTarget;
    if (state === STATES.success || state === STATES.loading) return;
    if (errorTimeout.current) {
      clearTimeout(errorTimeout.current);
      setError(undefined);
      setState(STATES.idle);
    }
    if (formAction && typeof formAction === "function") {
      try {
        setState(STATES.loading);
        const data = await formAction(new FormData(formEl));

        if (data.success) {
          setState(STATES.success);

          formEl.reset();
          setEmailValue("");
          setNameValue("");
        } else {
          setState(STATES.error);
          setError(data.error);
          errorTimeout.current = setTimeout(() => {
            setError(undefined);
            setState(STATES.idle);
          }, 3000);
        }
      } catch (error) {
        setState(STATES.error);
        setError("There was an error while submitting the form");
        console.error(error);
        errorTimeout.current = setTimeout(() => {
          setError(undefined);
          setState(STATES.idle);
        }, 3000);
      }
    }
  };
  const isSubmitted = state === "success";
  const inputDisabled = state === "loading";

  return (
    <form
      className="flex flex-col gap-3 w-full relative"
      onSubmit={handleSubmit}
    >
      <div className="flex flex-col gap-2">
        <input
          name="name"
          value={nameValue}
          className={clsx(
            "w-full text-sm px-4 py-2 h-11 bg-background cursor-text rounded-full text-foreground placeholder:text-muted-foreground border border-border"
          )}
          placeholder="Your name"
          disabled={inputDisabled}
          onChange={(e) => setNameValue(e.target.value)}
          autoComplete="name"
          data-1p-ignore
          data-lpignore
          autoFocus
          required
        />
        <div className="flex items-center justify-between gap-3 relative">
          <input
            name="email"
            {...props}
            value={emailValue}
            className={clsx(
              "flex-1 text-sm pl-4 pr-28 py-2 h-11 bg-background cursor-text rounded-full text-foreground placeholder:text-muted-foreground border border-border"
            )}
            placeholder="Your email"
            disabled={inputDisabled}
            onChange={(e) => setEmailValue(e.target.value)}
            autoComplete="email"
            data-1p-ignore
            data-lpignore
            required
          />
          <button
            type="submit"
            disabled={inputDisabled}
            className={clsx(
              "absolute h-8 px-3.5 bg-foreground text-background text-sm top-1/2 transform -translate-y-1/2 right-1.5 rounded-full font-medium flex gap-1 items-center",
              "disabled:cursor-not-allowed",
              {
                "bg-muted text-muted-foreground": state === "loading",
              },
              inputDisabled && "cursor-not-allowed bg-muted"
            )}
          >
            {state === "loading" ? (
              <>
                {buttonCopy.loading}
                <Loading />
              </>
            ) : isSubmitted ? (
              buttonCopy.success
            ) : (
              buttonCopy.idle
            )}
          </button>
        </div>
      </div>
      <div className="w-full h-2" />
      {error && (
        <p className="absolute text-xs text-destructive top-full -translate-y-1/2 px-2">
          {error}
        </p>
      )}
    </form>
  );
}

const Loading = () => (
  <div className="flex items-center gap-2">
    <div className="w-4 h-4 rounded-full border border-[currentColor] !border-t-[transparent] animate-spin" />
  </div>
);