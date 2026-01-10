"use client";

import { use } from "react";
import { MarketerDetail } from "@/components/marketers/marketer-detail";

/**
 * Creator Marketer Detail Page
 * Displays the marketer detail within the creator dashboard (with sidebar/header)
 */
export default function CreatorMarketerPage({
  params,
}: {
  params: Promise<{ marketerId: string }>;
}) {
  const { marketerId } = use(params);

  return (
    <MarketerDetail
      marketerId={marketerId}
      isPrivate={true}
      basePath="/founder/discover-marketers"
    />
  );
}

