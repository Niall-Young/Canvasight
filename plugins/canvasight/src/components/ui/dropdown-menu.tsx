import type { ButtonHTMLAttributes, HTMLAttributes, ReactElement } from "react";
import { cn } from "../../lib/utils";
import { Icon } from "./icon";

export function DropdownMenu({ className, ...props }: HTMLAttributes<HTMLDivElement>): ReactElement {
  return <div className={cn("kit-dropdown-menu", className)} {...props} />;
}

interface DropdownMenuItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: string;
  label: string;
  selected?: boolean;
}

export function DropdownMenuItem({ className, icon, label, selected = false, type = "button", ...props }: DropdownMenuItemProps): ReactElement {
  return (
    <button className={cn("kit-dropdown-menu-item", className)} type={type} {...props}>
      <span className="kit-dropdown-menu-item-content">
        {icon ? <Icon name={icon} size={16} className="kit-dropdown-menu-item-icon" /> : null}
        <span className="kit-dropdown-menu-item-label">{label}</span>
      </span>
      {selected ? <Icon name="check-md" size={16} className="kit-dropdown-menu-item-check" /> : null}
    </button>
  );
}
