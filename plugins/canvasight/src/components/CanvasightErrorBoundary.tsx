import { Component, type ErrorInfo, type ReactNode } from "react";
import { StartupFailurePanel, type StartupFailurePanelLabels } from "./StartupFailurePanel";

interface CanvasightErrorBoundaryProps {
  children: ReactNode;
  labels?: Partial<StartupFailurePanelLabels>;
  onError?: (error: Error, info: ErrorInfo) => void;
  onRetry: () => void;
  onReopenInNewTask: () => void;
  onCopyDiagnostics?: (diagnostics: string) => void | Promise<void>;
}

interface CanvasightErrorBoundaryState {
  error: Error | null;
  componentStack: string;
}

export class CanvasightErrorBoundary extends Component<CanvasightErrorBoundaryProps, CanvasightErrorBoundaryState> {
  state: CanvasightErrorBoundaryState = {
    error: null,
    componentStack: ""
  };

  static getDerivedStateFromError(error: Error): Partial<CanvasightErrorBoundaryState> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    this.setState({ componentStack: info.componentStack ?? "" });
    this.props.onError?.(error, info);
  }

  private handleRetry = (): void => {
    this.setState({ error: null, componentStack: "" });
    this.props.onRetry();
  };

  render(): ReactNode {
    const { error, componentStack } = this.state;
    if (!error) return this.props.children;

    const diagnostics = [
      "stage=react_render",
      `name=${error.name}`,
      `message=${error.message}`,
      error.stack ? `stack=${error.stack}` : "",
      componentStack ? `componentStack=${componentStack}` : ""
    ].filter(Boolean).join("\n");

    return (
      <StartupFailurePanel
        stage="react_render"
        reason={error.message || "The React workspace stopped rendering."}
        diagnostics={diagnostics}
        labels={this.props.labels}
        onRetry={this.handleRetry}
        onReopenInNewTask={this.props.onReopenInNewTask}
        onCopyDiagnostics={this.props.onCopyDiagnostics}
      />
    );
  }
}
