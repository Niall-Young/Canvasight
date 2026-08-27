import { memo, useEffect, type ReactElement, type RefObject } from "react";
import {
  canvasightApi,
  getCanvasightStartupIdentity,
  type CanvasightStartupStage
} from "../lib/canvasightApi";
import { useRenderCommitMetric } from "../lib/renderMetrics";

type WidgetLifecycleControllerProps = {
  canvasRef: RefObject<HTMLDivElement | null>;
  nativeWidget: boolean;
  onExternalRevision: (serverRevision: number) => Promise<void>;
  projectPath: string;
  startupStage: CanvasightStartupStage;
};

function WidgetLifecycleControllerComponent({
  canvasRef,
  nativeWidget,
  onExternalRevision,
  projectPath,
  startupStage
}: WidgetLifecycleControllerProps): ReactElement | null {
  useRenderCommitMetric("widgetLifecycle");

  useEffect(() => {
    if (!projectPath) return;
    let cancelled = false;
    let timer: number | null = null;
    let ownsLease = false;
    let requestInFlight = false;
    let standbyRetryUsed = false;
    let previouslyEligible = false;

    const clearTimer = () => {
      if (timer !== null) window.clearTimeout(timer);
      timer = null;
    };

    const schedule = (delayMs: number) => {
      if (cancelled) return;
      clearTimer();
      timer = window.setTimeout(() => {
        timer = null;
        void pollForExternalDocument();
      }, Math.max(0, delayMs));
    };

    const evidence = () => {
      const rect = canvasRef.current?.getBoundingClientRect();
      return {
        visible: document.visibilityState === "visible",
        focused: document.hasFocus(),
        canvasWidth: rect?.width ?? 0,
        canvasHeight: rect?.height ?? 0
      };
    };

    const isEligible = () => {
      if (!nativeWidget) return true;
      const identity = getCanvasightStartupIdentity();
      const current = evidence();
      return Boolean(
        startupStage === "ready" &&
          identity.stage === "ready" &&
          identity.displayMode === "fullscreen" &&
          current.visible &&
          current.focused &&
          current.canvasWidth > 0 &&
          current.canvasHeight > 0
      );
    };

    const releaseLease = async () => {
      clearTimer();
      if (!nativeWidget || !ownsLease) return;
      ownsLease = false;
      try {
        await canvasightApi.releaseRevisionPoll();
      } catch {
        // The daemon's bounded lease is the fallback for abrupt widget loss.
      }
    };

    const pollForExternalDocument = async (): Promise<void> => {
      if (cancelled || requestInFlight) return;
      if (!isEligible()) {
        await releaseLease();
        return;
      }
      requestInFlight = true;
      try {
        if (nativeWidget) {
          const lease = await canvasightApi.claimRevisionPoll(evidence());
          ownsLease = lease.owner;
          if (cancelled) {
            await releaseLease();
            return;
          }
          if (!isEligible()) {
            await releaseLease();
            return;
          }
          if (lease.owner && typeof lease.documentRevision === "number") {
            standbyRetryUsed = false;
            await onExternalRevision(lease.documentRevision);
            schedule(lease.pollIntervalMs);
          } else if (lease.status === "standby" && !standbyRetryUsed) {
            standbyRetryUsed = true;
            schedule(lease.retryAfterMs ?? 10_000);
          }
          return;
        }
        const session = await canvasightApi.getSession();
        if (!cancelled && session.projectPath === projectPath) await onExternalRevision(session.documentRevision);
        schedule(5_000);
      } catch {
        if (!cancelled && isEligible()) schedule(5_000);
      } finally {
        requestInFlight = false;
      }
    };

    const handleActivityChange = () => {
      const eligible = isEligible();
      const becameEligible = eligible && !previouslyEligible;
      previouslyEligible = eligible;
      if (becameEligible) {
        standbyRetryUsed = false;
        schedule(0);
      } else if (!eligible) {
        void releaseLease();
      }
    };
    const handlePageHide = () => {
      cancelled = true;
      void releaseLease();
    };
    const handleResourceTeardown = (event: Event) => {
      cancelled = true;
      clearTimer();
      const release = releaseLease();
      (event as CustomEvent<{ waitUntil?: (promise: Promise<unknown>) => void }>).detail?.waitUntil?.(release);
    };
    const observer = new ResizeObserver(handleActivityChange);
    if (canvasRef.current) observer.observe(canvasRef.current);
    document.addEventListener("visibilitychange", handleActivityChange);
    window.addEventListener("focus", handleActivityChange);
    window.addEventListener("blur", handleActivityChange);
    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("canvasight:host-context-changed", handleActivityChange);
    window.addEventListener("canvasight:resource-teardown", handleResourceTeardown);
    previouslyEligible = isEligible();
    if (previouslyEligible) schedule(0);

    return () => {
      cancelled = true;
      clearTimer();
      observer.disconnect();
      document.removeEventListener("visibilitychange", handleActivityChange);
      window.removeEventListener("focus", handleActivityChange);
      window.removeEventListener("blur", handleActivityChange);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("canvasight:host-context-changed", handleActivityChange);
      window.removeEventListener("canvasight:resource-teardown", handleResourceTeardown);
      void releaseLease();
    };
  }, [canvasRef, nativeWidget, onExternalRevision, projectPath, startupStage]);

  return null;
}

export const WidgetLifecycleController = memo(WidgetLifecycleControllerComponent);
WidgetLifecycleController.displayName = "WidgetLifecycleController";
