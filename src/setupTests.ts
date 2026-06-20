import "@testing-library/jest-dom";
import { vi } from "vitest";

// happy-dom does not implement window.confirm; stub it so vi.spyOn can override per-test
window.confirm = vi.fn(() => false);
