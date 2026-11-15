"use client";
import { startTransition } from "react";

/**
 * React 19 resets uncontrolled form fields after an action runs, which wipes what the user
 * typed when the server returns a validation error. Submitting via onSubmit keeps the values.
 */
export function keepValues(formAction: (fd: FormData) => void) {
  return (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => formAction(fd));
  };
}
