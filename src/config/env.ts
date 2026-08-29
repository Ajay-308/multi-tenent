import "dotenv/config";

function required(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing required env var: ${key}`);
  return v;
}

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "4000", 10),
  databaseUrl: required("DATABASE_URL"),
  jwtAccessSecret: required("JWT_ACCESS_SECRET"),
  jwtRefreshSecret: required("JWT_REFRESH_SECRET"),
  accessTokenTtl: "15m",
  refreshTokenTtlDays: 7,
  redisUrl: required("REDIS_URL"),
};

export default env;
