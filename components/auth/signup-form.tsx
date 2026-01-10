"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function SignupForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Initialize role from URL parameter
  const roleParam = searchParams.get("role");
  const initialRole = (roleParam === "marketer" || roleParam === "founder") ? roleParam : "founder";
  const [role, setRole] = useState<"founder" | "marketer">(initialRole);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role,
        },
      },
    });

    if (error) {
      setError(error.message);
      return;
    }

    if (data.user?.id) {
      const ensureResponse = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: data.user.id,
          email,
          name,
          role,
        }),
      });

      if (!ensureResponse.ok) {
        const payload = await ensureResponse.json().catch(() => null);
        setError(payload?.error ?? "Unable to create user profile.");
        return;
      }
    }

    if (data.session) {
      router.push(role === "marketer" ? "/marketer" : "/founder");
      router.refresh();
      return;
    }

    setMessage("Check your email to confirm your account before signing in.");
  };

  const handleGoogleSignup = async () => {
    setError("");
    setMessage("");
    const supabase = createClient();
    const redirectTo = new URL("/auth/callback", window.location.origin);
    redirectTo.searchParams.set("role", role);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectTo.toString(),
      },
    });

    if (error) {
      setError(error.message);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="bg-[#F9F8F6] rounded-[2.5rem] p-8 md:p-10">
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-black mb-2">Create an account</h1>
          <p className="text-sm text-black/60">
            Get started with RevShare today
          </p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6">
            <div className="flex flex-col gap-4">
              <Button
                variant="outline"
                className="w-full h-12 rounded-xl border-2 border-black/10 bg-white hover:bg-amber-50/50 text-black font-semibold"
                type="button"
                onClick={handleGoogleSignup}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4 mr-2">
                  <path
                    d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                    fill="currentColor"
                  />
                </svg>
                Sign up with Google
              </Button>
            </div>
            <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-black/10">
              <span className="relative z-10 bg-[#F9F8F6] px-3 text-black/50">
                Or continue with
              </span>
            </div>
            <div className="grid gap-5">
              <div className="grid gap-2">
                <Label htmlFor="name" className="text-sm font-semibold text-black">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                  className="h-12 rounded-xl border-2 border-black/10 bg-white focus:border-amber-500/50 focus:ring-0 text-black placeholder:text-black/40"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-sm font-semibold text-black">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 rounded-xl border-2 border-black/10 bg-white focus:border-amber-500/50 focus:ring-0 text-black placeholder:text-black/40"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password" className="text-sm font-semibold text-black">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 rounded-xl border-2 border-black/10 bg-white focus:border-amber-500/50 focus:ring-0 text-black placeholder:text-black/40"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role" className="text-sm font-semibold text-black">I want to join as</Label>
                <Select value={role} onValueChange={(v: "founder" | "marketer") => setRole(v)}>
                  <SelectTrigger className="!h-12 rounded-xl border-2 border-black/10 bg-white focus:border-amber-500/50 focus:ring-0 text-black data-[size=default]:!h-12">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-2 border-black/10">
                    <SelectItem value="founder">
                      Founder - I have products to promote
                    </SelectItem>
                    <SelectItem value="marketer">
                      Marketer - I want to earn commissions
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {error && (
                <p className="text-sm text-destructive font-medium">{error}</p>
              )}
              {message && (
                <p className="text-sm text-black/60 font-medium">{message}</p>
              )}
              <Button type="submit" className="w-full h-12 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold border-none text-base">
                Create account
              </Button>
            </div>
            <div className="text-center text-sm text-black/60">
              Already have an account?{" "}
              <Link href="/login" className="text-amber-600 hover:text-amber-700 font-semibold underline underline-offset-4">
                Login
              </Link>
            </div>
          </div>
        </form>
      </div>
      <div className="text-balance text-center text-xs text-black/50 [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-amber-600 [&_a]:text-amber-600">
        By clicking continue, you agree to our <a href="/terms">Terms of Service</a>{" "}
        and <a href="/privacy">Privacy Policy</a>.
      </div>
    </div>
  );
}
