import type { ButtonHTMLAttributes, ReactElement } from "react";
import { cn } from "../../lib/utils";

interface ToggleProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export function Toggle({ checked = false, className, onCheckedChange, type = "button", ...props }: ToggleProps): ReactElement {
  return (
    <button
      aria-pressed={checked}
      className={cn("kit-toggle", checked && "is-checked", className)}
      type={type}
      onClick={(event) => {
        props.onClick?.(event);
        if (!event.defaultPrevented && !props.disabled) onCheckedChange?.(!checked);
      }}
      {...props}
    >
      <span className="kit-toggle-handle" />
    </button>
  );
}
