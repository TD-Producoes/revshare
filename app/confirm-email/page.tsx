import Link from "next/link";
import { ChartPie, MailCheck } from "lucide-react";

import { Button } from "@/components/ui/button";

type ConfirmEmailPageProps = {
  searchParams?: {
    email?: string;
  };
};

export default function ConfirmEmailPage({ searchParams }: ConfirmEmailPageProps) {
  const email = searchParams?.email?.trim();

  return (
    <div className="bg-white flex min-h-svh flex-col items-center justify-center gap-8 p-6 md:p-10">
      <div className="flex w-full max-w-md flex-col gap-8">
        <Link
          href="/"
          className="flex items-center gap-2 self-center font-bold text-xl"
        >
          <ChartPie className="h-5 w-5" />
          <span>RevShare</span>
        </Link>
        <div className="bg-[#F9F8F6] rounded-[2.5rem] p-8 md:p-10 text-center">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-primary shadow-sm">
            <MailCheck className="h-6 w-6" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-black mb-3">
            Confirm your email
          </h1>
          <p className="text-sm text-black/60">
            {email
              ? `We sent a confirmation link to ${email}. Open it to finish setting up your account.`
              : "We sent a confirmation link to your email. Open it to finish setting up your account."}
          </p>
          <p className="mt-4 text-sm text-black/60">
            It can take a minute. Check your spam folder if you don&apos;t see it.
          </p>
          <div className="mt-8">
            <Button
              asChild
              className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold border-none text-base"
            >
              <Link href="/login">Back to login</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
