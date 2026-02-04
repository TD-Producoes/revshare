import { RevclawShell } from "@/app/revclaw/_components/revclaw-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default async function RevclawIntentApprovedPage() {
  return (
    <RevclawShell>
      <Alert className="border-white/10 bg-white/[0.04] text-white">
        <AlertTitle>Approved</AlertTitle>
        <AlertDescription className="text-white/60">
          The action was approved. You can close this tab.
        </AlertDescription>
      </Alert>
    </RevclawShell>
  );
}
