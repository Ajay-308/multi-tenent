export const shorthands = undefined;

export const up = (pgm) => {
  pgm.createTable("organizations", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    name: { type: "varchar(150)", notNull: true },
    slug: { type: "varchar(150)", notNull: true },
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
  pgm.addConstraint(
    "organizations",
    "organizations_slug_unique",
    "UNIQUE(slug)",
  );
};

export const down = (pgm) => {
  pgm.dropTable("organizations");
};
