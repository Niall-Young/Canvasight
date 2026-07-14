import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { FrameworkQuestionsCard } from "./components/FrameworkQuestionsCard";
import { startCanvasightWidgetBridge } from "./lib/widgetBridge";
import { isFrameworkQuestionsPayload, type FrameworkQuestionsPayload } from "./lib/frameworkQuestions";

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

function FrameworkQuestionsRoot(): React.ReactElement {
  const [payload, setPayload] = useState<FrameworkQuestionsPayload | null>(() => {
    const initial = window.__CANVASIGHT_FRAMEWORK_QUESTIONS__;
    return isFrameworkQuestionsPayload(initial) ? initial : null;
  });
  useEffect(() => {
    const handleQuestions = (event: Event) => {
      const next = (event as CustomEvent<unknown>).detail;
      if (isFrameworkQuestionsPayload(next)) setPayload(next);
    };
    window.addEventListener("canvasight:framework-questions", handleQuestions);
    return () => window.removeEventListener("canvasight:framework-questions", handleQuestions);
  }, []);
  if (!payload) return <main className="framework-questions-shell is-loading" aria-busy="true" />;
  return <FrameworkQuestionsCard key={payload.confirmationId} payload={payload} />;
}

try {
  startCanvasightWidgetBridge();
  const root = window.__CANVASIGHT_WIDGET_MODE__ === "framework-questions"
    ? <FrameworkQuestionsRoot />
    : <CanvasightRoot />;
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      {root}
    </React.StrictMode>
  );
} catch (error) {
  const message = error instanceof Error ? error.message : String(error || "Canvasight React bootstrap failed.");
  window.dispatchEvent(new CustomEvent("canvasight:app-error", { detail: { error: message, stage: "react" } }));
  throw error;
}
