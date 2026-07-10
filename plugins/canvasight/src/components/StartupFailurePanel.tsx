import { useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import { Button } from "./ui/button";
import { Icon } from "./ui/icon";

export interface StartupFailurePanelLabels {
  title: string;
  description: string;
  stage: string;
  reason: string;
  retry: string;
  reopen: string;
  copyDiagnostics: string;
  diagnosticsCopied: string;
  diagnosticsCopyFailed: string;
}

export interface StartupFailurePanelProps {
  stage: string;
  reason: string;
  diagnostics?: string;
  labels?: Partial<StartupFailurePanelLabels>;
  onRetry: () => void;
  onReopenInNewTask: () => void;
  onCopyDiagnostics?: (diagnostics: string) => void | Promise<void>;
}

const defaultLabels: StartupFailurePanelLabels = {
  title: "Canvasight couldn't start",
  description: "The canvas is unavailable, but no project data was changed.",
  stage: "Failed stage",
  reason: "Reason",
  retry: "Reconnect",
  reopen: "Reopen in a new task",
  copyDiagnostics: "Copy diagnostics",
  diagnosticsCopied: "Diagnostics copied",
  diagnosticsCopyFailed: "Couldn't copy diagnostics"
};

function redactDiagnostics(value: string): string {
  return value
    .replace(/https?:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?[^\s)\]}]*/gi, "[local daemon URL]")
    .replace(/\b(Bearer\s+)[A-Za-z0-9._~+\/-]+=*/gi, "$1[redacted]")
    .replace(/([?&](?:token|access_token|auth|secret|api_key)=)[^&\s]+/gi, "$1[redacted]")
    .replace(/\b((?:token|secret|api[_-]?key|authorization)\s*[:=]\s*)[^\s,;]+/gi, "$1[redacted]")
    .replace(/\/Users\/[^/\s]+/g, "~");
}

async function copyText(value: string): Promise<void> {
  if (!navigator.clipboard?.writeText) {
    throw new Error("Clipboard API unavailable");
  }
  await navigator.clipboard.writeText(value);
}

export function StartupFailurePanel({
  stage,
  reason,
  diagnostics = "",
  labels: labelOverrides,
  onRetry,
  onReopenInNewTask,
  onCopyDiagnostics
}: StartupFailurePanelProps): ReactElement {
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const labels = { ...defaultLabels, ...labelOverrides };
  const safeDiagnostics = useMemo(
    () => redactDiagnostics(diagnostics || `stage=${stage}\nreason=${reason}`),
    [diagnostics, reason, stage]
  );

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  async function handleCopy(): Promise<void> {
    try {
      await (onCopyDiagnostics ? onCopyDiagnostics(safeDiagnostics) : copyText(safeDiagnostics));
      setCopyStatus("copied");
    } catch {
      setCopyStatus("failed");
    }
  }

  const copyLabel =
    copyStatus === "copied"
      ? labels.diagnosticsCopied
      : copyStatus === "failed"
        ? labels.diagnosticsCopyFailed
        : labels.copyDiagnostics;

  return (
    <main className="startup-failure-shell" aria-labelledby="startup-failure-title">
      <section className="startup-failure-panel" role="alert" aria-live="assertive">
        <div className="startup-failure-icon" aria-hidden="true">
          <Icon name="error" size={20} />
        </div>
        <div className="startup-failure-content">
          <header className="startup-failure-header">
            <h1 id="startup-failure-title" ref={headingRef} tabIndex={-1}>
              {labels.title}
            </h1>
            <p>{labels.description}</p>
          </header>

          <dl className="startup-failure-details">
            <div>
              <dt>{labels.stage}</dt>
              <dd><code>{stage}</code></dd>
            </div>
            <div>
              <dt>{labels.reason}</dt>
              <dd>{reason}</dd>
            </div>
          </dl>

          <div className="startup-failure-actions">
            <Button variant="primary" onClick={onRetry}>
              <Icon name="redo" size={15} />
              {labels.retry}
            </Button>
            <Button onClick={onReopenInNewTask}>
              <Icon name="link-external" size={15} />
              {labels.reopen}
            </Button>
            <Button variant="ghost" onClick={() => void handleCopy()}>
              <Icon name="copy" size={15} />
              {copyLabel}
            </Button>
          </div>
          <span className="sr-only" role="status" aria-live="polite">
            {copyStatus === "copied" ? labels.diagnosticsCopied : copyStatus === "failed" ? labels.diagnosticsCopyFailed : ""}
          </span>
        </div>
      </section>
    </main>
  );
}

export { redactDiagnostics };
