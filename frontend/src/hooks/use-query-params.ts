"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

/**
 * A highly reusable hook for managing multiple URL query parameters simultaneously.
 * Perfect for complex filtering, searching, pagination, and multi-value states.
 */
export function useQueryParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  /**
   * Updates multiple query parameters at once.
   * Pass null, undefined, or an empty string to remove a parameter from the URL.
   *
   * @example
   * setQueryParams({ search: "john", status: "active", page: "1" })
   * setQueryParams({ status: null }) // Removes the 'status' parameter
   */
  const setQueryParams = useCallback(
    (paramsToUpdate: Record<string, string | string[] | null | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(paramsToUpdate).forEach(([key, value]) => {
        if (value === null || value === undefined || value === "") {
          // Remove the key if the value is explicitly null, undefined, or empty
          params.delete(key);
        } else if (Array.isArray(value)) {
          // Handle arrays (e.g., multiple filter selections) by setting multiple instances of the key or comma-separating
          params.delete(key);
          value.forEach((v) => params.append(key, v));
        } else {
          // Set standard string value
          params.set(key, value);
        }
      });

      const queryString = params.toString();
      const newUrl = queryString ? `${pathname}?${queryString}` : pathname;

      router.push(newUrl, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  // Expose a helper to easily get the current value of a parameter
  const getQueryParam = useCallback(
    (key: string, defaultValue: string = "") => {
      return searchParams.get(key) || defaultValue;
    },
    [searchParams]
  );

  // Expose a helper to get array values
  const getQueryParamArray = useCallback(
    (key: string) => {
      return searchParams.getAll(key);
    },
    [searchParams]
  );

  return { searchParams, setQueryParams, getQueryParam, getQueryParamArray };
}
