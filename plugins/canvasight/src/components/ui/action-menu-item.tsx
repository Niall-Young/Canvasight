import type { ButtonHTMLAttributes, ReactElement } from "react";
import { cn } from "../../lib/utils";
import { Icon } from "./icon";

interface ActionMenuItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: string | null;
  label: string;
  shortcut?: string;
}

export function ActionMenuItem({ className, icon = "work-with-apps", label, shortcut, type = "button", ...props }: ActionMenuItemProps): ReactElement {
  return (
    <button className={cn("kit-action-menu-item", className)} type={type} {...props}>
      <span className="kit-action-menu-item-content">
        {icon ? <Icon name={icon} size={16} className="kit-action-menu-item-icon" /> : null}
        <span className="kit-action-menu-item-label">{label}</span>
      </span>
      {shortcut ? <span className="kit-shortcut">{shortcut}</span> : null}
    </button>
  );
}
