"use client";

import { useState } from "react";
import Link from "next/link";
import { ChartPie } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      setError(error.message);
      return;
    }

    setMessage("Check your email for a password reset link.");
  };

  return (
    <div className="light bg-white flex min-h-svh flex-col items-center justify-center gap-8 p-6 md:p-10">
      <div className="flex w-full max-w-md flex-col gap-8">
        <Link
          href="/"
          className="flex items-center gap-2 self-center font-bold text-xl"
        >
          <ChartPie className="h-5 w-5" />
          <span>RevShare</span>
        </Link>
        <div className="bg-[#F9F8F6] rounded-[2.5rem] p-8 md:p-10">
          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-black mb-2">
              Reset your password
            </h1>
            <p className="text-sm text-black/60">
              Enter your email to receive a reset link
            </p>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-5">
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-sm font-semibold text-black">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  className="h-12 rounded-xl border-2 border-black/10 bg-white focus:border-primary/50 focus:ring-0 text-black placeholder:text-black/40"
                />
              </div>
              {error && (
                <p className="text-sm text-destructive font-medium">{error}</p>
              )}
              {message ? (
                <p className="text-sm text-black/60 font-medium">{message}</p>
              ) : (
                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold border-none text-base"
                >
                  Send reset link
                </Button>
              )}
            </div>
          </form>
          <div className="mt-6 text-center text-sm text-black/60">
            Remember your password?{" "}
            <Link
              href="/login"
              className="font-semibold underline underline-offset-4"
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
