import { forwardRef, type ButtonHTMLAttributes, type ReactElement } from "react";
import { cn } from "../../lib/utils";

interface KitButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  alert?: boolean;
  filled?: boolean;
  size?: "sm" | "md" | "lg";
}

export const KitButton = forwardRef<HTMLButtonElement, KitButtonProps>(function KitButton(
  { alert = false, className, filled = true, size = "md", type = "button", ...props },
  ref
): ReactElement {
  return <button ref={ref} className={cn("kit-button", `kit-button-${size}`, filled ? "is-filled" : "is-plain", alert && "is-alert", className)} type={type} {...props} />;
});
