import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { startCanvasightWidgetBridge } from "./lib/widgetBridge";

function ReactMountedSignal(): null {
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("canvasight:react-mounted"));
  }, []);
  return null;
}

function CanvasightRoot(): React.ReactElement {
  const [bindingKey, setBindingKey] = useState("initial");
  useEffect(() => {
    const handleRebind = (event: Event) => {
      const detail = (event as CustomEvent<{ current?: { bindingIssuedAt?: number; openAttemptId?: string; sessionId?: string } }>).detail;
      const current = detail?.current;
      setBindingKey(`${current?.sessionId || ""}:${current?.openAttemptId || ""}:${current?.bindingIssuedAt || 0}`);
    };
    window.addEventListener("canvasight:widget-rebind", handleRebind);
    return () => window.removeEventListener("canvasight:widget-rebind", handleRebind);
  }, []);
  return <React.Fragment key={bindingKey}><App /><ReactMountedSignal /></React.Fragment>;
}

try {
  startCanvasightWidgetBridge();
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <CanvasightRoot />
    </React.StrictMode>
  );
} catch (error) {
  const message = error instanceof Error ? error.message : String(error || "Canvasight React bootstrap failed.");
  window.dispatchEvent(new CustomEvent("canvasight:app-error", { detail: { error: message, stage: "react" } }));
  throw error;
}
