import type { ButtonHTMLAttributes, ReactElement } from "react";
import { cn } from "../../lib/utils";

interface CheckboxProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export function Checkbox({ checked = false, className, onCheckedChange, type = "button", ...props }: CheckboxProps): ReactElement {
  return (
    <button
      aria-pressed={checked}
      className={cn("kit-checkbox", checked && "is-checked", className)}
      type={type}
      onClick={(event) => {
        props.onClick?.(event);
        if (!event.defaultPrevented && !props.disabled) onCheckedChange?.(!checked);
      }}
      {...props}
    >
      <svg className="kit-checkbox-check" viewBox="0 0 8 6" fill="none" aria-hidden="true">
        <path d="M1 3L3 5L7 1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
