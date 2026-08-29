export const shorthands = undefined;

export const up = (pgm) => {
  pgm.createTable("projects", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    org_id: {
      type: "uuid",
      notNull: true,
      references: "organizations",
      onDelete: "CASCADE",
    },
    name: { type: "varchar(150)", notNull: true },
    description: { type: "text" },
    created_by: { type: "uuid", references: "users", onDelete: "SET NULL" },
    deleted_at: { type: "timestamptz" },
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

  pgm.createIndex("projects", "org_id");
  pgm.createIndex("projects", ["org_id"], {
    name: "projects_org_id_active_idx",
    where: "deleted_at IS NULL",
  });
};

export const down = (pgm) => {
  pgm.dropTable("projects");
};
