import type { ButtonHTMLAttributes, ReactElement } from "react";
import { cn } from "../../lib/utils";
import { Icon } from "./icon";

interface ToolbarItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: string;
  selected?: boolean;
}

export function ToolbarItem({ className, icon = "work-with-apps", selected = false, type = "button", ...props }: ToolbarItemProps): ReactElement {
  return (
    <button
      aria-pressed={selected}
      className={cn("kit-toolbar-item", selected && "is-selected", className)}
      type={type}
      {...props}
    >
      <Icon name={icon} size={20} />
    </button>
  );
}
