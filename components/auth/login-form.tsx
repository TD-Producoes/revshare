"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/shared/form-input";
import { Label } from "@/components/ui/label";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      return;
    }

    const role =
      data.user?.user_metadata?.role === "marketer" ||
      data.user?.user_metadata?.role === "founder"
        ? data.user.user_metadata.role
        : undefined;

    router.push(role === "marketer" ? "/marketer" : "/founder");
    router.refresh();
  };

  const handleGoogleLogin = async () => {
    const redirectUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${redirectUrl}/auth/callback`,
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
          <h1 className="text-2xl md:text-3xl font-bold text-black mb-2">Welcome back</h1>
          <p className="text-sm text-black/60">
            Login with your email to continue
          </p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6">
            <div className="flex flex-col gap-4">
              <Button
                variant="outline"
                className="w-full h-12 rounded-xl border-2 border-black/10 bg-white hover:bg-primary/10 text-black font-semibold"
                type="button"
                onClick={handleGoogleLogin}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4 mr-2">
                  <path
                    d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                    fill="currentColor"
                  />
                </svg>
                Login with Google
              </Button>
            </div>
            <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-black/10">
              <span className="relative z-10 bg-[#F9F8F6] px-3 text-black/50">
                Or continue with
              </span>
            </div>
            <div className="grid gap-5">
              <FormInput
                id="email"
                label="Email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={setEmail}
                required
                autoFocus
              />
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password" className="text-sm font-semibold text-black">Password</Label>
                  <Link
                    href="/forgot-password"
                    className="ml-auto text-sm font-semibold underline underline-offset-4"
                  >
                    Forgot your password?
                  </Link>
                </div>
                <FormInput
                  id="password"
                  label=""
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={setPassword}
                  required
                  hideLabel
                />
              </div>
              {error && (
                <p className="text-sm text-destructive font-medium">{error}</p>
              )}
              <Button type="submit" className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold border-none text-base">
                Login
              </Button>
            </div>
            <div className="text-center text-sm text-black/60">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="font-semibold underline underline-offset-4">
                Sign up
              </Link>
            </div>
          </div>
        </form>
      </div>
      <div className="text-balance text-center text-xs text-black/50 [&_a]:underline [&_a]:underline-offset-4">
        By clicking continue, you agree to our <a href="/terms">Terms of Service</a>{" "}
        and <a href="/privacy">Privacy Policy</a>.
      </div>
    </div>
  );
}
