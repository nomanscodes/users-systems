"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

/**
 * A reusable hook to synchronize active tab state with the URL search parameters.
 * Allows deep-linking to specific tabs and keeps the UI state consistent with the URL.
 *
 * @param defaultTab The default tab value if no query parameter is present.
 * @param queryKey The URL search parameter key to use (defaults to "tab").
 * @returns A tuple containing the active tab value and a setter function.
 */
export function useQueryTabs(defaultTab: string, queryKey: string = "tab") {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeTab = searchParams.get(queryKey) || defaultTab;

  const setActiveTab = useCallback(
    (tab: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (tab === defaultTab) {
        // Optional: Keep URL clean by removing the param if it's the default tab
        params.delete(queryKey);
      } else {
        params.set(queryKey, tab);
      }

      const queryString = params.toString();
      const newUrl = queryString ? `${pathname}?${queryString}` : pathname;

      // Update the URL without triggering a full page reload or scrolling to top
      router.push(newUrl, { scroll: false });
    },
    [pathname, router, searchParams, queryKey, defaultTab]
  );

  return [activeTab, setActiveTab] as const;
}
