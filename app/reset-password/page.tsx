"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChartPie } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const hydrateSession = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();

      if (!data.session && typeof window !== "undefined") {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");

        if (code) {
          await supabase.auth.exchangeCodeForSession(code);
        } else if (url.hash) {
          const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));
          const accessToken = hashParams.get("access_token");
          const refreshToken = hashParams.get("refresh_token");

          if (accessToken && refreshToken) {
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
          }
        }
      }

      setReady(true);
    };

    void hydrateSession();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      return;
    }

    setMessage("Password updated. You can now log in.");
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
              Set a new password
            </h1>
            <p className="text-sm text-black/60">
              Create a new password for your account
            </p>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-5">
              <div className="grid gap-2">
                <Label htmlFor="password" className="text-sm font-semibold text-black">
                  New password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter a new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoFocus
                  className="h-12 rounded-xl border-2 border-black/10 bg-white focus:border-primary/50 focus:ring-0 text-black placeholder:text-black/40"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirmPassword" className="text-sm font-semibold text-black">
                  Confirm password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="h-12 rounded-xl border-2 border-black/10 bg-white focus:border-primary/50 focus:ring-0 text-black placeholder:text-black/40"
                />
              </div>
              {!ready && (
                <p className="text-sm text-black/60 font-medium">
                  Preparing secure reset link...
                </p>
              )}
              {error && (
                <p className="text-sm text-destructive font-medium">{error}</p>
              )}
              {message && (
                <p className="text-sm text-black/60 font-medium">{message}</p>
              )}
              <Button
                type="submit"
                disabled={!ready}
                className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold border-none text-base disabled:opacity-60 disabled:pointer-events-none"
              >
                Update password
              </Button>
            </div>
          </form>
          <div className="mt-6 text-center text-sm text-black/60">
            Back to{" "}
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
