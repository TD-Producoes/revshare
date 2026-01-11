"use client";

import { use } from "react";
import { MarketerProjectDetail } from "@/components/marketer/project-detail";

/**
 * Marketer Offer Detail Page
 * Shows the detailed project view for approved offers (contracts)
 * This is different from the general project directory view
 */
export default function MarketerOfferPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);

  return <MarketerProjectDetail projectId={projectId} />;
}

