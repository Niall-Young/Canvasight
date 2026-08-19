import { describe, expect, it, vi } from "vitest";
import { stableGroupAction } from "./groupAction";

describe("Group header action activation", () => {
  it("runs once on pointer-up and ignores the following synthesized click", () => {
    const action = vi.fn();
    const stopPropagation = vi.fn();
    const handlers = stableGroupAction(action);
    handlers.onPointerDown?.({ stopPropagation } as never);
    handlers.onPointerUp?.({ stopPropagation } as never);
    handlers.onClick?.({ detail: 1, stopPropagation } as never);
    expect(stopPropagation).toHaveBeenCalledTimes(3);
    expect(action).toHaveBeenCalledTimes(1);
  });

  it("runs synthetic keyboard and native-host clicks that have no pointer event", () => {
    const action = vi.fn();
    const stopPropagation = vi.fn();
    const handlers = stableGroupAction(action);
    handlers.onClick?.({ detail: 0, stopPropagation } as never);
    expect(action).toHaveBeenCalledTimes(1);
    expect(stopPropagation).toHaveBeenCalledTimes(1);
  });
});
