import type { ReactElement } from "react";

export type WorkspaceStartupStage =
  | "starting"
  | "connecting_bridge"
  | "connecting_session"
  | "hydrating_project";

interface WorkspaceStartupSkeletonProps {
  stage: WorkspaceStartupStage;
  label: string;
}

export function WorkspaceStartupSkeleton({ stage, label }: WorkspaceStartupSkeletonProps): ReactElement {
  return (
    <main
      className="workspace-startup-skeleton"
      data-startup-stage={stage}
      data-startup-skeleton="true"
      aria-busy="true"
      aria-labelledby="workspace-startup-status"
    >
      <header className="workspace-startup-topbar" aria-hidden="true">
        <span className="workspace-startup-brand skeleton-pulse" />
        <span className="workspace-startup-project skeleton-pulse" />
        <div className="workspace-startup-controls">
          <button type="button" tabIndex={-1} disabled aria-label="Unavailable while Canvasight starts" />
          <button type="button" tabIndex={-1} disabled aria-label="Unavailable while Canvasight starts" />
          <button type="button" tabIndex={-1} disabled aria-label="Unavailable while Canvasight starts" />
        </div>
      </header>
      <section className="workspace-startup-canvas" aria-hidden="true">
        <div className="workspace-startup-node workspace-startup-node-primary skeleton-pulse">
          <span />
          <span />
          <span />
        </div>
        <div className="workspace-startup-edge" />
        <div className="workspace-startup-node workspace-startup-node-secondary skeleton-pulse">
          <span />
          <span />
        </div>
      </section>
      <div className="workspace-startup-status" role="status" aria-live="polite">
        <span className="workspace-startup-spinner" aria-hidden="true" />
        <span id="workspace-startup-status">{label}</span>
      </div>
    </main>
  );
}
