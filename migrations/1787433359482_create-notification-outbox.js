/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

export const up = (pgm) => {
  pgm.createType("outbox_status", ["pending", "dispatched"]);

  pgm.createTable("notification_outbox", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    type: { type: "varchar(50)", notNull: true },
    payload: { type: "jsonb", notNull: true },
    status: { type: "outbox_status", notNull: true, default: "pending" },
    attempts: { type: "int", notNull: true, default: 0 },
    dispatched_at: { type: "timestamptz" },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });

  pgm.createIndex("notification_outbox", ["status"], {
    name: "notification_outbox_pending_idx",
    where: "status = 'pending'",
  });
};

export const down = (pgm) => {
  pgm.dropTable("notification_outbox");
  pgm.dropType("outbox_status");
};
