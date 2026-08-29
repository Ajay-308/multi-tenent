export const shorthands = undefined;

export const up = (pgm) => {
  pgm.createExtension("citext", { ifNotExists: true });

  pgm.createTable("users", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    name: { type: "varchar(120)", notNull: true },
    email: { type: "citext", notNull: true },
    password_hash: { type: "text", notNull: true },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });

  pgm.addConstraint("users", "users_email_unique", "UNIQUE(email)");
};

export const down = (pgm) => {
  pgm.dropTable("users");
};
