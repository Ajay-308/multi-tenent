import { describe, expect, it } from "vitest";
import { buildOffsetResult, toOffset } from "../../src/utils/pagination.ts";

describe("pagination helpers", () => {
  it("calculates the offset from page and limit", () => {
    expect(toOffset({ page: 3, limit: 20 })).toBe(40);
  });

  it("returns the documented offset pagination shape", () => {
    expect(buildOffsetResult(["task"], 1, 1, 20)).toEqual({
      data: ["task"],
      total: 1,
      page: 1,
      limit: 20,
    });
  });
});
