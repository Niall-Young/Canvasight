import { Children, isValidElement } from "react";
import type { ButtonHTMLAttributes, CSSProperties, HTMLAttributes, MouseEvent, PointerEvent, ReactElement, ReactNode } from "react";
import { cn } from "../../lib/utils";
import { Icon } from "./icon";

export function Segmented({ children, className, style, ...props }: HTMLAttributes<HTMLDivElement>): ReactElement {
  const selectedIndex = Children.toArray(children).findIndex((child: ReactNode) => isValidElement<SegmentedItemProps>(child) && child.props.selected);
  const indicatorStyle = {
    ...style,
    "--kit-segmented-selected-index": Math.max(selectedIndex, 0),
    "--kit-segmented-indicator-opacity": selectedIndex >= 0 ? 1 : 0,
  } as CSSProperties;

  return (
    <div className={cn("kit-segmented", className)} role="tablist" style={indicatorStyle} {...props}>
      {children}
    </div>
  );
}

interface SegmentedItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: string;
  selected?: boolean;
}

export function SegmentedItem({
  className,
  icon = "marker-code",
  selected = false,
  type = "button",
  onClick,
  onMouseDown,
  onPointerDown,
  ...props
}: SegmentedItemProps): ReactElement {
  function handlePointerDown(event: PointerEvent<HTMLButtonElement>): void {
    event.stopPropagation();
    onPointerDown?.(event);
  }

  function handleMouseDown(event: MouseEvent<HTMLButtonElement>): void {
    event.stopPropagation();
    onMouseDown?.(event);
  }

  function handleClick(event: MouseEvent<HTMLButtonElement>): void {
    event.stopPropagation();
    onClick?.(event);
  }

  return (
    <button
      aria-selected={selected}
      className={cn("kit-segmented-item", selected && "is-selected", className)}
      role="tab"
      type={type}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onPointerDown={handlePointerDown}
      {...props}
    >
      <Icon name={icon} size={16} />
    </button>
  );
}
