"use client";

import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

interface DroppableColumnProps {
  columnId: string;
  children: React.ReactNode;
  isOver?: boolean;
}

export function DroppableColumn({ columnId, children }: DroppableColumnProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: `column::${columnId}`,
    data: { type: "column", columnId },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "transition-all duration-150",
        isOver && "ring-2 ring-primary ring-offset-2 rounded-xl scale-[1.01]"
      )}
    >
      {children}
    </div>
  );
}
