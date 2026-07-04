import type { ButtonHTMLAttributes, ReactElement } from "react";
import { cn } from "../../lib/utils";
import { Icon } from "./icon";

interface DropdownTriggerProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  hasValue?: boolean;
  label: string;
  size?: "sm" | "lg";
}

export function DropdownTrigger({ className, hasValue = false, label, size = "lg", type = "button", ...props }: DropdownTriggerProps): ReactElement {
  return (
    <button className={cn("kit-dropdown-trigger", `kit-dropdown-trigger-${size}`, hasValue && "has-value", className)} type={type} {...props}>
      <span>{label}</span>
      <Icon name="chevron-down-md" size={16} />
    </button>
  );
}
