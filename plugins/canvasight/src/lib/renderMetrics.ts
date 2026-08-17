import { useLayoutEffect } from "react";

const maxSamplesPerScope = 240;

export type CanvasightRenderSample = {
  committedAt: number;
  duration: number;
};

export type CanvasightRenderMetrics = {
  commits: Record<string, number>;
  samples: Record<string, CanvasightRenderSample[]>;
  version: 1;
};

declare global {
  interface Window {
    __CANVASIGHT_RENDER_METRICS__?: CanvasightRenderMetrics;
  }
}

function renderMetrics(): CanvasightRenderMetrics {
  const existing = window.__CANVASIGHT_RENDER_METRICS__;
  if (existing) return existing;
  const created: CanvasightRenderMetrics = {
    commits: {},
    samples: {},
    version: 1
  };
  window.__CANVASIGHT_RENDER_METRICS__ = created;
  return created;
}

export function useRenderCommitMetric(scope: string): void {
  const renderStartedAt = performance.now();
  useLayoutEffect(() => {
    const metrics = renderMetrics();
    metrics.commits[scope] = (metrics.commits[scope] ?? 0) + 1;
    const samples = metrics.samples[scope] ?? [];
    samples.push({
      committedAt: performance.now(),
      duration: Math.max(0, performance.now() - renderStartedAt)
    });
    if (samples.length > maxSamplesPerScope) samples.splice(0, samples.length - maxSamplesPerScope);
    metrics.samples[scope] = samples;
  });
}
