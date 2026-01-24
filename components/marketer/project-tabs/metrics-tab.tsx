import { MarketerMetricsTab } from "@/components/creator/marketer-tabs/metrics-tab";

type MetricsTimeline = Array<{
  date: string;
  projectRevenue: number;
  affiliateRevenue: number;
  commissionOwed: number;
  purchasesCount: number;
  customersCount: number;
  clicksCount: number;
  installsCount: number;
}>;

export function MarketerProjectMetricsTab({
  timeline,
  clicksTotal,
  installsTotal,
  currency,
  projectId,
  projectName,
}: {
  timeline: MetricsTimeline;
  clicksTotal: number;
  installsTotal: number;
  currency: string;
  projectId: string | null;
  projectName: string;
}) {
  const projects = projectId ? [{ id: projectId, name: projectName }] : [];

  return (
    <MarketerMetricsTab
      timeline={timeline}
      currency={currency}
      projects={projects}
      selectedProjectId={projectId}
      onSelectProject={() => null}
      showProjectFilter={false}
      clicksTotal={clicksTotal}
      installsTotal={installsTotal}
    />
  );
}
