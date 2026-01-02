"use client";

import { use } from "react";

import { CreatorMarketerDetail } from "@/components/creator/marketer-detail";

export default function CreatorMarketerPage({
  params,
}: {
  params: Promise<{ marketerId: string }>;
}) {
  const { marketerId } = use(params);
  return <CreatorMarketerDetail marketerId={marketerId} />;
}
