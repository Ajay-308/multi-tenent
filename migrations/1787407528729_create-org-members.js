export const shorthands = undefined;

export const up = (pgm) => {
  pgm.createType("org_role", ["org_admin", "member"]);

  pgm.createTable("org_members", {
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
    user_id: {
      type: "uuid",
      notNull: true,
      references: "users",
      onDelete: "CASCADE",
    },
    role: { type: "org_role", notNull: true, default: "member" },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });

  pgm.addConstraint(
    "org_members",
    "org_members_org_user_unique",
    "UNIQUE(org_id, user_id)",
  );
  pgm.createIndex("org_members", "user_id");
  pgm.createIndex("org_members", "org_id");
};

export const down = (pgm) => {
  pgm.dropTable("org_members");
  pgm.dropType("org_role");
};
