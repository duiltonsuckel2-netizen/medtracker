import { describe, it, expect, beforeEach, vi } from "vitest";
import { loadKey, saveKey } from "./storage.js";

// Mock localStorage
const store = {};
const localStorageMock = {
  getItem: vi.fn((key) => store[key] ?? null),
  setItem: vi.fn((key, value) => { store[key] = value; }),
  removeItem: vi.fn((key) => { delete store[key]; }),
  clear: vi.fn(() => { Object.keys(store).forEach((k) => delete store[k]); }),
};
Object.defineProperty(globalThis, "localStorage", { value: localStorageMock });

describe("storage", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe("loadKey()", () => {
    it("returns fallback when key does not exist", async () => {
      const result = await loadKey("missing", "default");
      expect(result).toBe("default");
    });

    it("returns parsed value when key exists", async () => {
      store["test"] = JSON.stringify({ a: 1 });
      const result = await loadKey("test", null);
      expect(result).toEqual({ a: 1 });
    });

    it("returns fallback on parse error", async () => {
      store["bad"] = "not-json{";
      const result = await loadKey("bad", []);
      expect(result).toEqual([]);
    });

    it("handles arrays", async () => {
      store["arr"] = JSON.stringify([1, 2, 3]);
      const result = await loadKey("arr", []);
      expect(result).toEqual([1, 2, 3]);
    });

    it("handles boolean values", async () => {
      store["bool"] = JSON.stringify(true);
      const result = await loadKey("bool", false);
      expect(result).toBe(true);
    });
  });

  describe("saveKey()", () => {
    it("saves a value as JSON", async () => {
      await saveKey("key1", { hello: "world" });
      expect(localStorageMock.setItem).toHaveBeenCalledWith("key1", '{"hello":"world"}');
    });

    it("saves arrays", async () => {
      await saveKey("arr", [1, 2, 3]);
      expect(localStorageMock.setItem).toHaveBeenCalledWith("arr", "[1,2,3]");
    });

    it("saves primitive values", async () => {
      await saveKey("num", 42);
      expect(localStorageMock.setItem).toHaveBeenCalledWith("num", "42");
    });

    it("handles setItem errors gracefully", async () => {
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});
      localStorageMock.setItem.mockImplementationOnce(() => { throw new Error("quota exceeded"); });
      await saveKey("fail", "data");
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });
});
