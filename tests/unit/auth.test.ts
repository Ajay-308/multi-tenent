import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const findByEmail = vi.fn();
const create = vi.fn();
const hashPassword = vi.fn();
const signAccessToken = vi.fn();
const signRefreshToken = vi.fn();
const refreshCreate = vi.fn();

vi.mock("../../src/repositories/user.repository.ts", () => ({
  userRepository: { findByEmail, create },
}));
vi.mock("../../src/repositories/refreshToken.repository.ts", () => ({
  refreshTokenRepository: { create: refreshCreate },
}));
vi.mock("../../src/utils/password.ts", () => ({
  hashPassword,
  comparePassword: vi.fn(),
}));
vi.mock("../../src/utils/jwt.ts", () => ({
  signAccessToken,
  signRefreshToken,
}));

let authService: (typeof import("../../src/service/auth.service.ts"))["authService"];

describe("authentication service", () => {
  beforeAll(async () => {
    ({ authService } = await import("../../src/service/auth.service.ts"));
  });

  beforeEach(() => {
    vi.clearAllMocks();
    signAccessToken.mockReturnValue("access-token");
    signRefreshToken.mockReturnValue("refresh-token");
    hashPassword.mockResolvedValue("hashed-password");
    refreshCreate.mockResolvedValue(undefined);
  });

  it("rejects duplicate registration", async () => {
    findByEmail.mockResolvedValue({ id: "existing" });

    await expect(
      authService.register(
        { name: "Alice", email: "alice@example.com", password: "Password123!" },
        {},
      ),
    ).rejects.toMatchObject({ code: "EMAIL_IN_USE" });
    expect(create).not.toHaveBeenCalled();
  });

  it("hashes the password and issues tokens on registration", async () => {
    findByEmail.mockResolvedValue(null);
    create.mockResolvedValue({
      id: "user-1",
      name: "Alice",
      email: "alice@example.com",
    });

    await expect(
      authService.register(
        { name: "Alice", email: "alice@example.com", password: "Password123!" },
        { ipAddress: "127.0.0.1" },
      ),
    ).resolves.toMatchObject({
      user: { id: "user-1" },
      accessToken: "access-token",
      refreshToken: "refresh-token",
    });
    expect(hashPassword).toHaveBeenCalledWith("Password123!");
    expect(refreshCreate).toHaveBeenCalled();
  });
});
