export const shorthands = undefined;

export const up = (pgm) => {
  pgm.sql(`
    CREATE FUNCTION set_updated_at() RETURNS trigger AS $$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END
    $$ LANGUAGE plpgsql;
  `);

  const tables = ["users", "organizations", "projects", "tasks", "comments"];
  for (const t of tables) {
    pgm.sql(`
      CREATE TRIGGER ${t}_set_updated_at
      BEFORE UPDATE ON ${t}
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    `);
  }
};

export const down = (pgm) => {
  const tables = ["users", "organizations", "projects", "tasks", "comments"];
  for (const t of tables) {
    pgm.sql(`DROP TRIGGER IF EXISTS ${t}_set_updated_at ON ${t};`);
  }
  pgm.sql("DROP FUNCTION IF EXISTS set_updated_at;");
};
