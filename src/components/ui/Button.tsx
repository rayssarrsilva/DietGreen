import { clsx } from "clsx";
import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
}

export function Button({ variant = "primary", className, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-md px-5 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
        variant === "primary" &&
          "bg-primary text-white hover:bg-primary-hover",
        variant === "secondary" &&
          "bg-surface text-ink border border-border hover:bg-surface-2",
        variant === "ghost" && "text-ink-muted hover:text-ink",
        className
      )}
      {...props}
    />
  );
}
