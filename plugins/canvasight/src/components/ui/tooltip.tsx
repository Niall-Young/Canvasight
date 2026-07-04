import { useState, type HTMLAttributes, type ReactElement, type ReactNode } from "react";
import { cn } from "../../lib/utils";

interface TooltipProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  shortcut?: string;
}

export function Tooltip({ children, className, shortcut, ...props }: TooltipProps): ReactElement {
  return (
    <div className={cn("kit-tooltip", shortcut && "has-shortcut", className)} role="tooltip" {...props}>
      <span>{children}</span>
      {shortcut ? <span className="kit-shortcut is-sunken">{shortcut}</span> : null}
    </div>
  );
}

interface TooltipAnchorProps extends HTMLAttributes<HTMLSpanElement> {
  align?: "start" | "center" | "end";
  children: ReactNode;
  label: ReactNode;
  shortcut?: string;
  side?: "top" | "right" | "bottom" | "left";
  tooltipClassName?: string;
}

export function TooltipAnchor({
  align = "center",
  children,
  className,
  label,
  onBlur,
  onClick,
  onFocus,
  onPointerEnter,
  onPointerLeave,
  shortcut,
  side = "top",
  tooltipClassName,
  ...props
}: TooltipAnchorProps): ReactElement {
  const [dismissed, setDismissed] = useState(false);

  return (
    <span
      className={cn("kit-tooltip-anchor", `is-side-${side}`, `is-align-${align}`, dismissed && "is-tooltip-dismissed", className)}
      onBlur={(event) => {
        setDismissed(false);
        onBlur?.(event);
      }}
      onClick={(event) => {
        setDismissed(true);
        onClick?.(event);
      }}
      onFocus={(event) => {
        setDismissed(false);
        onFocus?.(event);
      }}
      onPointerEnter={(event) => {
        setDismissed(false);
        onPointerEnter?.(event);
      }}
      onPointerLeave={(event) => {
        setDismissed(false);
        onPointerLeave?.(event);
      }}
      {...props}
    >
      {children}
      <Tooltip className={cn("kit-tooltip-floating", tooltipClassName)} shortcut={shortcut} aria-hidden="true">
        {label}
      </Tooltip>
    </span>
  );
}
