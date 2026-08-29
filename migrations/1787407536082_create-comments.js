export const shorthands = undefined;

export const up = (pgm) => {
  pgm.createTable("comments", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    task_id: {
      type: "uuid",
      notNull: true,
      references: "tasks",
      onDelete: "CASCADE",
    },
    author_id: {
      type: "uuid",
      notNull: true,
      references: "users",
      onDelete: "RESTRICT",
    },
    body: { type: "text", notNull: true },
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
  pgm.createIndex("comments", ["task_id", "created_at"]);
};

export const down = (pgm) => {
  pgm.dropTable("comments");
};
