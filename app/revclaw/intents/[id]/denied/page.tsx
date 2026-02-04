import { RevclawShell } from "@/app/revclaw/_components/revclaw-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default async function RevclawIntentDeniedPage() {
  return (
    <RevclawShell>
      <Alert
        variant="destructive"
        className="border-destructive/40 bg-white/[0.04]"
      >
        <AlertTitle>Denied</AlertTitle>
        <AlertDescription>
          The action was denied. You can close this tab.
        </AlertDescription>
      </Alert>
    </RevclawShell>
  );
}
