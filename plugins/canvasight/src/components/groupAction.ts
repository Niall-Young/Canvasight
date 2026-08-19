import type { ButtonHTMLAttributes } from "react";

export function stableGroupAction(action: () => void): Pick<ButtonHTMLAttributes<HTMLButtonElement>, "onPointerDown" | "onPointerUp" | "onClick"> {
  return {
    onPointerDown: (event) => event.stopPropagation(),
    onPointerUp: (event) => { event.stopPropagation(); action(); },
    onClick: (event) => {
      event.stopPropagation();
      // Pointer activation already ran on pointer-up so a newly measured XYFlow
      // node cannot swallow the action. Keyboard, assistive technology, and the
      // native Widget harness emit a detail=0 click without pointer events.
      if (event.detail === 0) action();
    }
  };
}
