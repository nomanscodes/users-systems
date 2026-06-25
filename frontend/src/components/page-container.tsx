import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * PageContainer — global inner-page layout wrapper.
 * Provides consistent max-width, horizontal centering, vertical spacing and padding
 * for all dashboard pages. Use this as the root wrapper inside every page.tsx.
 *
 * Max-width: max-w-6xl (1152px) — wide enough for data-rich pages.
 * Override with `className` if a specific page needs a tighter or wider layout.
 */
export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-8xl space-y-6 px-2 py-2",
        className,
      )}
    >
      {children}
    </div>
  );
}
