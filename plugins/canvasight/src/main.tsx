import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { startCanvasightWidgetBridge } from "./lib/widgetBridge";

function ReactMountedSignal(): null {
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("canvasight:react-mounted"));
  }, []);
  return null;
}

try {
  startCanvasightWidgetBridge();
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <App />
      <ReactMountedSignal />
    </React.StrictMode>
  );
} catch (error) {
  const message = error instanceof Error ? error.message : String(error || "Canvasight React bootstrap failed.");
  window.dispatchEvent(new CustomEvent("canvasight:app-error", { detail: { error: message, stage: "react" } }));
  throw error;
}
