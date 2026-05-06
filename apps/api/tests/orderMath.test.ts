import { describe, expect, it } from "vitest";
import { calculateOrderTotal } from "../src/services/orderMath";

describe("calculateOrderTotal", () => {
  it("applies discount and tax correctly", () => {
    expect(calculateOrderTotal(1200, 100, 54)).toBe(1154);
  });

  it("keeps precision stable", () => {
    expect(calculateOrderTotal(999.991, 0.111, 0.222)).toBe(1000.1);
  });
});
