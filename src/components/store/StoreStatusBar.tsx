"use client";

import { Info } from "lucide-react";
import { StoreStatusCountdown } from "./StoreStatusCountdown";
import { useStoreOverlays } from "@/lib/store-context";

interface StoreStatusBarProps {
  lastOrderAtISO: string | null;
  closingTimeLabel: string | null;
  nextOpeningLabel: string | null;
  closingSoonThresholdMin: number;
  clockOffsetMs?: number;
}

export function StoreStatusBar({
  lastOrderAtISO,
  closingTimeLabel,
  nextOpeningLabel,
  closingSoonThresholdMin,
  clockOffsetMs,
}: StoreStatusBarProps) {
  const { openInfo } = useStoreOverlays();

  return (
    <div className="flex items-center justify-between px-4 py-3">
      <StoreStatusCountdown
        lastOrderAtISO={lastOrderAtISO}
        closingTimeLabel={closingTimeLabel}
        nextOpeningLabel={nextOpeningLabel}
        closingSoonThresholdMin={closingSoonThresholdMin}
        clockOffsetMs={clockOffsetMs}
      />

      <button
        type="button"
        onClick={openInfo}
        className="flex items-center gap-1 rounded-full border border-line px-3 py-1.5 text-xs font-medium text-content transition-transform duration-150 active:scale-95"
      >
        <Info size={14} aria-hidden="true" />
        Ver informações
      </button>
    </div>
  );
}
