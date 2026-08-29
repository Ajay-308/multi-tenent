export class AppError extends Error {
  statusCode: number;
  code: string;
  details?: Record<string, unknown>;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export const Errors = {
  invalidCredentials: () =>
    new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password"),
  emailInUse: () =>
    new AppError(409, "EMAIL_IN_USE", "Email already registered"),
  unauthorized: () =>
    new AppError(401, "UNAUTHORIZED", "Authentication required"),
  forbidden: () =>
    new AppError(403, "FORBIDDEN", "You do not have access to this resource"),
  invalidRefreshToken: () =>
    new AppError(
      401,
      "INVALID_REFRESH_TOKEN",
      "Refresh token is invalid or expired",
    ),
  notFound: (what: string, code: string) =>
    new AppError(404, code, `${what} not found`),
  validation: (details: Record<string, unknown>) =>
    new AppError(400, "VALIDATION_ERROR", "Validation failed", details),
};
