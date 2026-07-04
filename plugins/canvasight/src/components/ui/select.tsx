import type { ButtonHTMLAttributes, ReactElement } from "react";
import { cn } from "../../lib/utils";
import { Icon } from "./icon";

interface SelectTriggerProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  filled?: boolean;
  label: string;
  size?: "sm" | "lg";
}

export function SelectTrigger({ className, filled = false, label, size = "sm", type = "button", ...props }: SelectTriggerProps): ReactElement {
  return (
    <button className={cn("kit-select-trigger", `kit-select-trigger-${size}`, filled && "is-filled", className)} type={type} {...props}>
      <span className="kit-select-trigger-label">{label}</span>
      <Icon name="chevron-down-md" size={16} />
    </button>
  );
}
