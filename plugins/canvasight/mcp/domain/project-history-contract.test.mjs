import { describe, expect, it } from "vitest";
import {
  buildGitProjectIdentity,
  codexTurnBoundaryFromNotification,
  codexTurnObservationIds,
  compareGitProjectIdentities,
  normalizeGitRemoteIdentity,
  summarizeCodexThread,
  summarizeCodexTurn
} from "./project-history-contract.mjs";

describe("Project History identity contract", () => {
  it("normalizes transport differences and removes credentials", () => {
    expect(normalizeGitRemoteIdentity("https://user:secret@GitHub.com/Owner/Repo.git")).toBe("github.com/Owner/Repo");
    expect(normalizeGitRemoteIdentity("git@github.com:Owner/Repo.git")).toBe("github.com/Owner/Repo");
    expect(normalizeGitRemoteIdentity("ssh://git@github.com:22/Owner/Repo.git")).toBe("github.com/Owner/Repo");
  });

  it("groups worktrees by their common Git directory", () => {
    const shared = {
      gitCommonDir: "/repo/.git",
      rootCommits: ["root"],
      remoteUrls: ["https://github.com/example/repo.git"]
    };
    const first = buildGitProjectIdentity({ ...shared, worktreeRoot: "/repo" });
    const second = buildGitProjectIdentity({ ...shared, worktreeRoot: "/tmp/worktree" });
    expect(compareGitProjectIdentities(first, second)).toEqual({
      sameLocalProject: true,
      samePortableProject: true
    });
  });

  it("does not merge unrelated local repositories with the same remote evidence", () => {
    const shared = {
      worktreeRoot: "/repo",
      rootCommits: ["root"],
      remoteUrls: ["https://github.com/example/repo.git"]
    };
    const first = buildGitProjectIdentity({ ...shared, gitCommonDir: "/repo/.git" });
    const second = buildGitProjectIdentity({ ...shared, gitCommonDir: "/clone/.git" });
    expect(compareGitProjectIdentities(first, second)).toEqual({
      sameLocalProject: false,
      samePortableProject: true
    });
  });

  it("does not invent a portable identity from a shallow repository boundary", () => {
    const identity = buildGitProjectIdentity({
      gitCommonDir: "/repo/.git",
      worktreeRoot: "/repo",
      rootCommits: ["shallow-boundary"],
      remoteUrls: [],
      isShallow: true
    });
    expect(identity.portableProjectId).toBeNull();
    expect(identity.portabilityBasis).toBe("unavailable");
    expect(identity.warnings).toHaveLength(1);
  });

  it("keeps local identity available before the first commit", () => {
    const identity = buildGitProjectIdentity({
      gitCommonDir: "/repo/.git",
      worktreeRoot: "/repo",
      rootCommits: [],
      remoteUrls: []
    });
    expect(identity.localProjectId).toMatch(/^git-local-/u);
    expect(identity.portableProjectId).toBeNull();
    expect(identity.portabilityBasis).toBe("unavailable");
  });
});

describe("Project History Codex activity contract", () => {
  it("keeps thread summaries lightweight", () => {
    expect(summarizeCodexThread({
      id: "thread-1",
      cwd: "/repo",
      name: "Feature",
      preview: "private chat text",
      createdAt: 1,
      updatedAt: 2,
      status: { type: "idle" },
      ephemeral: false
    })).toEqual({
      id: "thread-1",
      cwd: "/repo",
      name: "Feature",
      createdAt: 1,
      updatedAt: 2,
      recencyAt: null,
      status: "idle",
      source: null,
      ephemeral: false,
      forkedFromId: null
    });
  });

  it.each(["completed", "interrupted", "failed"])("treats %s as a terminal turn boundary", (status) => {
    const turn = summarizeCodexTurn({ id: `turn-${status}`, status });
    expect(turn.terminal).toBe(true);
    expect(codexTurnBoundaryFromNotification("turn/completed", {
      threadId: "thread-1",
      turn: { id: turn.id, status }
    })).toMatchObject({ phase: "completed", status, terminal: true });
  });

  it("keeps in-progress turns open", () => {
    expect(summarizeCodexTurn({ id: "turn-live", status: "inProgress" })).toMatchObject({ terminal: false });
    expect(codexTurnBoundaryFromNotification("turn/started", {
      threadId: "thread-1",
      turn: { id: "turn-live", status: "inProgress" }
    })).toMatchObject({ phase: "started", terminal: false });
  });

  it("derives stable restart-safe observation ids", () => {
    const turn = { id: "turn-1", status: "interrupted" };
    expect(codexTurnObservationIds("thread-1", turn)).toEqual([
      "codex:thread-1:turn-1:started",
      "codex:thread-1:turn-1:terminal:interrupted"
    ]);
    expect(codexTurnObservationIds("thread-1", { ...turn })).toEqual(codexTurnObservationIds("thread-1", turn));
  });
});
