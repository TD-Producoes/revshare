import { SignupForm } from "@/components/auth/signup-form";
import { ChartPie } from "lucide-react";
import Link from "next/link";

export default function SignupPage() {
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
        <SignupForm />
      </div>
    </div>
  );
}
