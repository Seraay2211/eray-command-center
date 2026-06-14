import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({ children, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "app-card rounded-[14px] border shadow-[0_12px_36px_rgba(0,0,0,0.12)]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
