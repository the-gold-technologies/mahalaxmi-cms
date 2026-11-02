"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";

type Status = "loading" | "ready" | "error";

/**
 * Loads a page's saved sections. Editors must only render when status === "ready":
 * rendering them before the data arrives (or after a failed load) shows empty forms,
 * and saving those would overwrite the live content with blanks.
 */
export function usePageSections(url: string) {
  const [data, setData] = useState<Record<string, any>>({});
  const [status, setStatus] = useState<Status>("loading");

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const res = await fetch(url, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Failed to load");
      setData(json.data && typeof json.data === "object" ? json.data : {});
      setStatus("ready");
    } catch (err) {
      console.error(`Failed to load ${url}:`, err);
      setStatus("error");
    }
  }, [url]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, status, reload: load };
}

export function SectionsLoadState({ status, onRetry }: { status: Status; onRetry: () => void }) {
  if (status === "ready") return null;
  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-10 flex flex-col items-center gap-3 text-sm text-gray-500">
      {status === "loading" ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin text-[#D8232A]" />
          Loading saved content...
        </>
      ) : (
        <>
          <p>Could not load the saved content, so editing is disabled to protect the live page.</p>
          <button
            type="button"
            onClick={onRetry}
            className="flex items-center gap-1.5 text-xs font-bold text-[#D8232A] hover:text-[#b51b21] cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </>
      )}
    </div>
  );
}
