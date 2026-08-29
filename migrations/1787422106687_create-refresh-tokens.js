/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * refresh_tokens
 * DB-backed refresh token store. Raw token kabhi store nahi hota - sirf
 * SHA-256 hash - taaki DB leak se bhi session mint na ho sake. Revocation
 * ek column flip hai (revoked_at), isse single-session logout aur
 * logout-all-devices dono support hote hain audit history khoye bina.
 *
 * CASCADE decision:
 * - user_id -> users: ON DELETE CASCADE. Refresh token user account ke
 *   bina meaningless hai.
 *
 * replaced_by_token_id rotation (bonus) ke liye hai: refresh call pe purana
 * row naye token ki taraf point karta hai phir revoke ho jaata hai. Agar
 * revoked token dobara aaye - iska matlab replay/theft - poori chain revoke.
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  pgm.createTable("refresh_tokens", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    user_id: {
      type: "uuid",
      notNull: true,
      references: "users",
      onDelete: "CASCADE",
    },
    token_hash: { type: "text", notNull: true },
    user_agent: { type: "text" },
    ip_address: { type: "inet" },
    revoked_at: { type: "timestamptz" },
    replaced_by_token_id: { type: "uuid" },
    expires_at: { type: "timestamptz", notNull: true },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });

  // Har refresh call token_hash se lookup karti hai - unique + indexed.
  pgm.addConstraint(
    "refresh_tokens",
    "refresh_tokens_token_hash_unique",
    "UNIQUE(token_hash)",
  );

  // Logout-all-devices ek user ki saari active rows revoke karta hai.
  pgm.createIndex("refresh_tokens", "user_id");
  pgm.createIndex("refresh_tokens", ["user_id"], {
    name: "refresh_tokens_active_idx",
    where: "revoked_at IS NULL",
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTable("refresh_tokens");
};
