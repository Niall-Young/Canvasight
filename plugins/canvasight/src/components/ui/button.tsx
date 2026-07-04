import type { ButtonHTMLAttributes, ReactElement, ReactNode } from "react";
import { cn } from "../../lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "icon";
  children: ReactNode;
}

export function Button({ className, variant = "secondary", size = "md", children, ...props }: ButtonProps): ReactElement {
  return (
    <button className={cn("ui-button", `ui-button-${variant}`, `ui-button-${size}`, className)} {...props}>
      {children}
    </button>
  );
}
