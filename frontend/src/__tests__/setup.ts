import { vi, beforeEach } from "vitest";

global.fetch = vi.fn();

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});
