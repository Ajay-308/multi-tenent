import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const findMembership = vi.fn();
const add = vi.fn();
const findByEmail = vi.fn();

vi.mock("../../src/repositories/org.repository.ts", () => ({
  orgMemberRepository: { findMembership, add },
}));
vi.mock("../../src/repositories/user.repository.ts", () => ({
  userRepository: { findByEmail },
}));

let orgService: (typeof import("../../src/service/org.service.ts"))["orgService"];

describe("org member service", () => {
  beforeAll(async () => {
    ({ orgService } = await import("../../src/service/org.service.ts"));
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("adds a member by userId", async () => {
    findMembership.mockResolvedValueOnce(null).mockResolvedValueOnce({
      id: "member-1",
      org_id: "org-1",
      user_id: "user-2",
      role: "member",
      created_at: new Date("2026-01-01"),
      name: "Bob",
      email: "bob@example.com",
    });
    add.mockResolvedValue({
      id: "member-1",
      org_id: "org-1",
      user_id: "user-2",
      role: "member",
      created_at: new Date("2026-01-01"),
    });

    await expect(
      orgService.addMember("org-1", { userId: "user-2", role: "member" }),
    ).resolves.toMatchObject({
      alreadyMember: false,
      member: { userId: "user-2", role: "member" },
    });
  });

  it("resolves a member by email", async () => {
    findByEmail.mockResolvedValue({ id: "user-3", email: "carol@example.com" });
    findMembership.mockResolvedValueOnce(null).mockResolvedValueOnce({
      id: "member-2",
      org_id: "org-1",
      user_id: "user-3",
      role: "member",
      created_at: new Date("2026-01-01"),
      name: "Carol",
      email: "carol@example.com",
    });
    add.mockResolvedValue({
      id: "member-2",
      org_id: "org-1",
      user_id: "user-3",
      role: "member",
      created_at: new Date("2026-01-01"),
    });

    await expect(
      orgService.addMember("org-1", { email: "carol@example.com", role: "member" }),
    ).resolves.toMatchObject({ alreadyMember: false, member: { userId: "user-3" } });
    expect(findByEmail).toHaveBeenCalledWith("carol@example.com");
  });

  it("returns alreadyMember for duplicate membership", async () => {
    findMembership.mockResolvedValue({
      id: "member-1",
      org_id: "org-1",
      user_id: "user-2",
      role: "member",
      created_at: new Date("2026-01-01"),
      name: "Bob",
      email: "bob@example.com",
    });

    await expect(
      orgService.addMember("org-1", { userId: "user-2", role: "member" }),
    ).resolves.toMatchObject({ alreadyMember: true });
    expect(add).not.toHaveBeenCalled();
  });

  it("throws when email does not match a user", async () => {
    findByEmail.mockResolvedValue(null);

    await expect(
      orgService.addMember("org-1", { email: "missing@example.com", role: "member" }),
    ).rejects.toMatchObject({ code: "USER_NOT_FOUND" });
  });
});
