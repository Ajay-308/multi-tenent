import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env.ts";

export interface AccessTokenPayload {
  sub: string;
}

export function signAccessToken(userId: string): string {
  return jwt.sign({ sub: userId }, env.jwtAccessSecret, {
    expiresIn: env.accessTokenTtl as SignOptions["expiresIn"],
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.jwtAccessSecret) as AccessTokenPayload;
}

// Refresh-token validity is controlled by its database row.
export interface RefreshTokenPayload {
  sub: string;
  jti: string;
}

export function signRefreshToken(userId: string, jti: string): string {
  return jwt.sign({ sub: userId, jti }, env.jwtRefreshSecret, {
    expiresIn: `${env.refreshTokenTtlDays}d` as SignOptions["expiresIn"],
  });
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, env.jwtRefreshSecret) as RefreshTokenPayload;
}
