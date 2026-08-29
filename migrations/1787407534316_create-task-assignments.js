export const shorthands = undefined;

export const up = (pgm) => {
  pgm.createTable("task_assignments", {
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
    user_id: {
      type: "uuid",
      notNull: true,
      references: "users",
      onDelete: "CASCADE",
    },
    assigned_by: { type: "uuid", references: "users", onDelete: "SET NULL" },
    assigned_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });

  pgm.addConstraint(
    "task_assignments",
    "task_assignments_task_user_unique",
    "UNIQUE(task_id, user_id)",
  );
  pgm.createIndex("task_assignments", "task_id");
  pgm.createIndex("task_assignments", "user_id");
};

export const down = (pgm) => {
  pgm.dropTable("task_assignments");
};
