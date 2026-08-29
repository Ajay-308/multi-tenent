export const shorthands = undefined;

export const up = (pgm) => {
  pgm.createType("task_status", ["todo", "in_progress", "review", "done"]);
  pgm.createType("task_priority", ["low", "medium", "high", "urgent"]);

  pgm.createTable("tasks", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    project_id: {
      type: "uuid",
      notNull: true,
      references: "projects",
      onDelete: "CASCADE",
    },
    title: { type: "varchar(200)", notNull: true },
    description: { type: "text" },
    status: { type: "task_status", notNull: true, default: "todo" },
    priority: { type: "task_priority", notNull: true, default: "medium" },
    due_date: { type: "date" },
    created_by: { type: "uuid", references: "users", onDelete: "SET NULL" },
    deleted_at: { type: "timestamptz" },
    search_vector: { type: "tsvector" },
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

  pgm.createIndex("tasks", "project_id");
  pgm.createIndex("tasks", ["project_id", "status"]);
  pgm.createIndex("tasks", ["project_id", "priority"]);
  pgm.createIndex("tasks", "due_date");
  pgm.createIndex("tasks", ["project_id"], {
    name: "tasks_project_id_active_idx",
    where: "deleted_at IS NULL",
  });
  pgm.createIndex("tasks", "search_vector", { method: "gin" });

  pgm.sql(`
    CREATE FUNCTION tasks_search_vector_update() RETURNS trigger AS $$
    BEGIN
      NEW.search_vector :=
        setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B');
      RETURN NEW;
    END
    $$ LANGUAGE plpgsql;
  `);

  pgm.sql(`
    CREATE TRIGGER tasks_search_vector_trigger
    BEFORE INSERT OR UPDATE OF title, description ON tasks
    FOR EACH ROW EXECUTE FUNCTION tasks_search_vector_update();
  `);
};

export const down = (pgm) => {
  pgm.sql("DROP TRIGGER IF EXISTS tasks_search_vector_trigger ON tasks;");
  pgm.sql("DROP FUNCTION IF EXISTS tasks_search_vector_update;");
  pgm.dropTable("tasks");
  pgm.dropType("task_priority");
  pgm.dropType("task_status");
};
