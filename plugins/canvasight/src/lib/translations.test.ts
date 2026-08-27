import { describe, expect, it } from "vitest";
import { createTranslator } from "./translations";

describe("Run status copy", () => {
  it("explains the browser test-page limitation without internal transport jargon", () => {
    const chinese = createTranslator("zh")("status.browserFallbackNoBridge");
    const english = createTranslator("en")("status.browserFallbackNoBridge");

    expect(chinese).toBe("当前打开的是测试页面，任务没有发送。请回到 Codex，重新打开 Canvasight 后再运行。");
    expect(english).toBe("This is a test page, so the task was not sent. Return to Codex, reopen Canvasight, and run it again.");
    expect(`${chinese} ${english}`).not.toMatch(/fallback|widget|host bridge|await_canvasight_run|thread|payload/i);
  });
});
