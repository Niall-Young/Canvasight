import type { ButtonHTMLAttributes, ReactElement } from "react";
import { cn } from "../../lib/utils";
import { Icon } from "./icon";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  filled?: boolean;
  icon?: string;
  size?: "sm" | "md" | "lg";
}

export function IconButton({ className, filled = true, icon = "x", size = "lg", type = "button", ...props }: IconButtonProps): ReactElement {
  return (
    <button className={cn("kit-icon-button", `kit-icon-button-${size}`, filled ? "is-filled" : "is-plain", className)} type={type} {...props}>
      <Icon name={icon} size={16} />
    </button>
  );
}
