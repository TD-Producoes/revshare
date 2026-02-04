import Link from "next/link";

import { RevclawShell } from "@/app/revclaw/_components/revclaw-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default async function RevclawClaimApprovedPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await props.searchParams;
  const installationId = typeof sp.installation_id === "string" ? sp.installation_id : null;

  return (
    <RevclawShell>
      <Alert className="border-white/10 bg-white/[0.04] text-white">
        <AlertTitle>Bot approved</AlertTitle>
        <AlertDescription className="text-white/60">
          The bot is now connected to your account.
          {installationId ? (
            <>
              <br />
              Installation id: <span className="font-mono">{installationId}</span>
            </>
          ) : null}
        </AlertDescription>
        <div className="mt-3">
          <Button asChild>
            <Link href="/founder/bots">View bots</Link>
          </Button>
        </div>
      </Alert>
    </RevclawShell>
  );
}
