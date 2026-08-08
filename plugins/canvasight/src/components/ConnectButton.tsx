import { useCallback, useEffect, useRef, type MouseEvent as ReactMouseEvent, type ReactElement } from "react";
import { useCanvasActions, type ConnectedNodeSide } from "../application/CanvasActionsContext";
import { useI18n } from "../lib/i18n";
import { Icon } from "./ui/icon";

interface ConnectButtonProps {
  nodeId: string;
  side: ConnectedNodeSide;
}

export function ConnectButton({ nodeId, side }: ConnectButtonProps): ReactElement {
  const actions = useCanvasActions();
  const { t } = useI18n();
  const suppressClickRef = useRef(false);
  const removeListenersRef = useRef<(() => void) | null>(null);
  const menuOpen = actions.activeConnectedNodeMenu?.nodeId === nodeId
    && actions.activeConnectedNodeMenu.side === side;

  useEffect(() => () => removeListenersRef.current?.(), []);

  const requestMenu = useCallback((button: HTMLButtonElement, clientX?: number, clientY?: number) => {
    const rect = button.getBoundingClientRect();
    actions.requestConnectedNodeMenu(nodeId, side, {
      clientX: clientX ?? rect.left + rect.width / 2,
      clientY: clientY ?? rect.top + rect.height / 2,
      focusTarget: button
    });
  }, [actions, nodeId, side]);

  const handleMouseDown = useCallback((event: ReactMouseEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    removeListenersRef.current?.();
    const button = event.currentTarget;
    const startX = event.clientX;
    const startY = event.clientY;
    let dragged = false;

    function removeListeners(): void {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      if (removeListenersRef.current === removeListeners) removeListenersRef.current = null;
    }

    function handleMouseMove(moveEvent: MouseEvent): void {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      if (deltaX * deltaX + deltaY * deltaY > 16) dragged = true;
    }

    function handleMouseUp(upEvent: MouseEvent): void {
      removeListeners();
      suppressClickRef.current = true;
      if (dragged) return;
      upEvent.preventDefault();
      requestMenu(button, upEvent.clientX, upEvent.clientY);
    }

    removeListenersRef.current = removeListeners;
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }, [requestMenu]);

  const handleClick = useCallback((event: ReactMouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      event.preventDefault();
      return;
    }
    requestMenu(event.currentTarget);
  }, [requestMenu]);

  return (
    <button
      className="node-connect-button"
      type="button"
      aria-label={side === "left" ? t("task.connectLeft") : t("task.connectRight")}
      aria-haspopup="menu"
      aria-expanded={menuOpen}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
    >
      <Icon name="plus-lg" size={16} />
    </button>
  );
}
