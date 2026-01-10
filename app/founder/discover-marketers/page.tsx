"use client";

import { MarketersDirectory } from "@/components/marketers/marketers-directory";

/**
 * Creator Discover Marketers Page
 * Displays the marketers directory within the creator dashboard (with sidebar/header)
 */
export default function CreatorDiscoverMarketersPage() {
  return (
    <MarketersDirectory
      isPrivate={true}
      title="Discover Marketers"
      description="Discover and connect with top-performing marketers"
      showBreadcrumbs={false}
    />
  );
}

