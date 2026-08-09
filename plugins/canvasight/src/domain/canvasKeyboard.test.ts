import { describe, expect, it } from "vitest";
import { shouldDeleteCanvasSelection } from "./canvasKeyboard";

const baseInput = {
  key: "Backspace",
  hasPrimaryModifier: false,
  altKey: false,
  shiftKey: false,
  targetIsEditable: false,
  targetIsKeyboardInteractive: false,
  targetNodeIsSelected: false
};

describe("canvas keyboard deletion", () => {
  it("deletes a selection when Backspace comes from a control inside the selected node", () => {
    expect(shouldDeleteCanvasSelection({
      ...baseInput,
      targetIsKeyboardInteractive: true,
      targetNodeIsSelected: true
    })).toBe(true);
  });

  it("keeps editable node content safe from Backspace", () => {
    expect(shouldDeleteCanvasSelection({
      ...baseInput,
      targetIsEditable: true,
      targetIsKeyboardInteractive: true,
      targetNodeIsSelected: true
    })).toBe(false);
  });

  it("does not delete the canvas selection from a control outside the selected node", () => {
    expect(shouldDeleteCanvasSelection({
      ...baseInput,
      targetIsKeyboardInteractive: true
    })).toBe(false);
  });

  it("supports Delete from a non-interactive canvas target", () => {
    expect(shouldDeleteCanvasSelection({ ...baseInput, key: "Delete" })).toBe(true);
  });

  it("ignores modified deletion shortcuts", () => {
    expect(shouldDeleteCanvasSelection({ ...baseInput, hasPrimaryModifier: true })).toBe(false);
    expect(shouldDeleteCanvasSelection({ ...baseInput, altKey: true })).toBe(false);
    expect(shouldDeleteCanvasSelection({ ...baseInput, shiftKey: true })).toBe(false);
  });
});
