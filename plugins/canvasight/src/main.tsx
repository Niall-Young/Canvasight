import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { startCanvasightWidgetBridge } from "./lib/widgetBridge";

try {
  startCanvasightWidgetBridge();
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  window.requestAnimationFrame(() => {
    window.dispatchEvent(new CustomEvent("canvasight:react-mounted"));
  });
} catch (error) {
  const message = error instanceof Error ? error.message : String(error || "Canvasight React bootstrap failed.");
  window.dispatchEvent(new CustomEvent("canvasight:app-error", { detail: { error: message, stage: "react" } }));
  throw error;
}
