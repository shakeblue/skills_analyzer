"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams, redirect } from "next/navigation";

// ---------------------------------------------------------------------------
// Roadmap entry page -- redirects /roadmap?analysis={id} -> /roadmap/{id}
// ---------------------------------------------------------------------------

export default function RoadmapEntryPage() {
  return (
    <Suspense fallback={<div className="p-8 text-muted-foreground">Loading...</div>}>
      <RoadmapRedirect />
    </Suspense>
  );
}

function RoadmapRedirect() {
  const searchParams = useSearchParams();
  const analysisId = searchParams.get("analysis");

  useEffect(() => {
    if (analysisId) {
      redirect(`/roadmap/${analysisId}`);
    }
  }, [analysisId]);

  if (!analysisId) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">
          No analysis ID provided. Please navigate here from an analysis result.
        </p>
      </div>
    );
  }

  return null;
}
