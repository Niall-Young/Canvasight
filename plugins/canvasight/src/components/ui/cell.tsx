import type { ReactElement, ReactNode } from "react";
import { cn } from "../../lib/utils";
import { SelectTrigger } from "./select";
import { Toggle } from "./toggle";

interface CellProps {
  action?: ReactNode;
  className?: string;
  description?: string;
  heading: string;
}

export function Cell({ action, className, description, heading }: CellProps): ReactElement {
  return (
    <div className={cn("kit-cell", className)}>
      <span className="kit-cell-content">
        <span className="kit-cell-heading">{heading}</span>
        {description ? <span className="kit-cell-description">{description}</span> : null}
      </span>
      {action ? <span className="kit-cell-action">{action}</span> : null}
    </div>
  );
}

interface SelectCellProps extends Omit<CellProps, "action"> {
  selectLabel?: string;
}

export function SelectCell({ selectLabel = "Chinese", ...props }: SelectCellProps): ReactElement {
  return <Cell {...props} action={<SelectTrigger filled label={selectLabel} size="sm" className="kit-cell-select" />} />;
}

interface ToggleCellProps extends Omit<CellProps, "action"> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export function ToggleCell({ checked = true, onCheckedChange, ...props }: ToggleCellProps): ReactElement {
  return <Cell {...props} action={<Toggle checked={checked} onCheckedChange={onCheckedChange} />} />;
}
