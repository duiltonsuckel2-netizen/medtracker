import { describe, it, expect } from "vitest";
import {
  DARK, LIGHT, S, R, H,
  SH_DARK, SH_LIGHT,
  F, FN, FM,
  applyTheme, inp, btn, tag,
} from "./theme.js";

describe("theme constants", () => {
  it("DARK palette has all required keys", () => {
    const keys = ["bg", "surface", "card", "card2", "border", "border2", "text", "text2", "text3", "green", "blue", "teal", "yellow", "red", "purple"];
    keys.forEach((k) => expect(DARK).toHaveProperty(k));
  });

  it("LIGHT palette has all required keys", () => {
    const keys = ["bg", "surface", "card", "card2", "border", "border2", "text", "text2", "text3", "green", "blue", "teal", "yellow", "red", "purple"];
    keys.forEach((k) => expect(LIGHT).toHaveProperty(k));
  });

  it("spacing scale has correct values", () => {
    expect(S.xs).toBe(4);
    expect(S.sm).toBe(8);
    expect(S.md).toBe(12);
    expect(S.lg).toBe(16);
    expect(S.xl).toBe(24);
  });

  it("border radius has correct values", () => {
    expect(R.sm).toBe(10);
    expect(R.md).toBe(14);
    expect(R.pill).toBe(999);
  });

  it("height scale has correct values", () => {
    expect(H.sm).toBe(36);
    expect(H.md).toBe(44);
    expect(H.lg).toBe(48);
  });

  it("font stacks are strings", () => {
    expect(typeof F).toBe("string");
    expect(typeof FN).toBe("string");
    expect(typeof FM).toBe("string");
  });
});

describe("applyTheme()", () => {
  it("switches to dark theme", () => {
    applyTheme(true);
    const { C } = await_import();
    // After applyTheme(true), re-import to check
    // Since C is a let export, we verify by calling inp/btn which use C internally
    const style = inp();
    expect(style.background).toBe(DARK.surface);
    expect(style.color).toBe(DARK.text);
  });

  it("switches to light theme", () => {
    applyTheme(false);
    const style = inp();
    expect(style.background).toBe(LIGHT.surface);
    expect(style.color).toBe(LIGHT.text);
  });
});

// Helper to test theme state via inp()
function await_import() {
  return { C: null }; // placeholder - we test via inp/btn
}

describe("inp()", () => {
  it("returns a style object with required properties", () => {
    applyTheme(true);
    const style = inp();
    expect(style).toHaveProperty("background");
    expect(style).toHaveProperty("border");
    expect(style).toHaveProperty("borderRadius", R.md);
    expect(style).toHaveProperty("color");
    expect(style).toHaveProperty("fontSize", 14);
    expect(style).toHaveProperty("width", "100%");
  });

  it("merges extra styles", () => {
    const style = inp({ maxWidth: 300 });
    expect(style.maxWidth).toBe(300);
  });
});

describe("btn()", () => {
  it("returns a button style with defaults", () => {
    applyTheme(true);
    const style = btn();
    expect(style).toHaveProperty("background");
    expect(style).toHaveProperty("border", "none");
    expect(style).toHaveProperty("borderRadius", R.md);
    expect(style).toHaveProperty("cursor", "pointer");
    expect(style).toHaveProperty("fontWeight", 600);
  });

  it("accepts custom background color", () => {
    const style = btn("#FF0000");
    expect(style.background).toBe("#FF0000");
  });

  it("merges extra styles", () => {
    const style = btn("#FF0000", { marginTop: 10 });
    expect(style.marginTop).toBe(10);
  });
});

describe("tag()", () => {
  it("returns a tag style with color-based background", () => {
    const style = tag("#22C55E");
    expect(style.color).toBe("#22C55E");
    expect(style.background).toContain("#22C55E");
    expect(style.display).toBe("inline-flex");
    expect(style.fontSize).toBe(11);
  });
});

describe("shadows", () => {
  it("SH_DARK has sm, md, lg, glow", () => {
    expect(typeof SH_DARK.sm).toBe("string");
    expect(typeof SH_DARK.md).toBe("string");
    expect(typeof SH_DARK.lg).toBe("string");
    expect(typeof SH_DARK.glow).toBe("function");
    expect(typeof SH_DARK.glow("#FF0000")).toBe("string");
  });

  it("SH_LIGHT has sm, md, lg, glow", () => {
    expect(typeof SH_LIGHT.sm).toBe("string");
    expect(typeof SH_LIGHT.md).toBe("string");
    expect(typeof SH_LIGHT.lg).toBe("string");
    expect(typeof SH_LIGHT.glow).toBe("function");
  });
});
