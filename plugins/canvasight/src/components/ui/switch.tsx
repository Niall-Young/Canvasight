import * as SwitchPrimitive from "@radix-ui/react-switch";
import type { MouseEvent, PointerEvent, ReactElement } from "react";

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
}

export function Switch({ checked, onCheckedChange, label }: SwitchProps): ReactElement {
  function stopCanvasEvent(event: MouseEvent | PointerEvent): void {
    event.stopPropagation();
  }

  function toggleFromLabel(event: MouseEvent<HTMLSpanElement>): void {
    event.stopPropagation();
    if (event.target instanceof HTMLElement && event.target.closest(".switch-root")) return;
    onCheckedChange(!checked);
  }

  return (
    <span className="switch-row nodrag nopan" onPointerDown={stopCanvasEvent} onMouseDown={stopCanvasEvent} onClick={toggleFromLabel}>
      {label ? <span>{label}</span> : null}
      <SwitchPrimitive.Root
        className="switch-root nodrag nopan"
        checked={checked}
        onPointerDown={stopCanvasEvent}
        onMouseDown={stopCanvasEvent}
        onClick={stopCanvasEvent}
        onCheckedChange={onCheckedChange}
      >
        <SwitchPrimitive.Thumb className="switch-thumb" />
      </SwitchPrimitive.Root>
    </span>
  );
}
