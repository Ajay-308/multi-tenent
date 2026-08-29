import { randomUUID } from "crypto";
import { userRepository } from "../repositories/user.repository.ts";
import { refreshTokenRepository } from "../repositories/refreshToken.repository.ts";
import { hashPassword, comparePassword } from "../utils/password.ts";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.ts";
import { Errors } from "../utils/error.ts";
import { env } from "../config/env.ts";

function refreshExpiryDate(): Date {
  const d = new Date();
  d.setDate(d.getDate() + env.refreshTokenTtlDays);
  return d;
}

async function issueTokenPair(
  userId: string,
  meta: { userAgent?: string; ipAddress?: string },
) {
  const jti = randomUUID();
  const refreshToken = signRefreshToken(userId, jti);
  await refreshTokenRepository.create({
    id: jti,
    userId,
    token: refreshToken,
    expiresAt: refreshExpiryDate(),
    userAgent: meta.userAgent,
    ipAddress: meta.ipAddress,
  });
  const accessToken = signAccessToken(userId);
  return { accessToken, refreshToken };
}

export const authService = {
  async register(
    input: { name: string; email: string; password: string },
    meta: { userAgent?: string; ipAddress?: string },
  ) {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) throw Errors.emailInUse();

    const passwordHash = await hashPassword(input.password);
    const user = await userRepository.create({
      name: input.name,
      email: input.email,
      passwordHash,
    });
    const tokens = await issueTokenPair(user.id, meta);
    return {
      user: { id: user.id, name: user.name, email: user.email },
      ...tokens,
    };
  },

  async login(
    input: { email: string; password: string },
    meta: { userAgent?: string; ipAddress?: string },
  ) {
    const user = await userRepository.findByEmail(input.email);
    if (!user) throw Errors.invalidCredentials();

    const ok = await comparePassword(input.password, user.password_hash);
    if (!ok) throw Errors.invalidCredentials();

    const tokens = await issueTokenPair(user.id, meta);
    return {
      user: { id: user.id, name: user.name, email: user.email },
      ...tokens,
    };
  },

  // Revoke the session family when a revoked or expired token is reused.
  async refresh(
    rawToken: string,
    meta: { userAgent?: string; ipAddress?: string },
  ) {
    let payload;
    try {
      payload = verifyRefreshToken(rawToken);
    } catch {
      throw Errors.invalidRefreshToken();
    }

    const stored = await refreshTokenRepository.findByToken(rawToken);
    if (!stored) throw Errors.invalidRefreshToken();

    if (stored.revoked_at || new Date(stored.expires_at) < new Date()) {
      await refreshTokenRepository.revokeAllForUser(payload.sub);
      throw Errors.invalidRefreshToken();
    }

    const tokens = await issueTokenPair(payload.sub, meta);
    const newStored = await refreshTokenRepository.findByToken(
      tokens.refreshToken,
    );
    await refreshTokenRepository.revokeById(stored.id, newStored?.id);

    return tokens;
  },

  async logout(rawToken: string) {
    const stored = await refreshTokenRepository.findByToken(rawToken);
    if (stored && !stored.revoked_at) {
      await refreshTokenRepository.revokeById(stored.id);
    }
  },

  async logoutAll(userId: string) {
    await refreshTokenRepository.revokeAllForUser(userId);
  },
};
