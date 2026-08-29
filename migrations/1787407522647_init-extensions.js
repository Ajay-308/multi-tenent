export const shorthands = undefined;

export const up = (pgm) => {
  pgm.createExtension("pgcrypto", { ifNotExists: true });
  pgm.createExtension("pg_trgm", { ifNotExists: true });
};

export const down = (pgm) => {
  pgm.dropExtension("pg_trgm", { ifExists: true });
  pgm.dropExtension("pgcrypto", { ifExists: true });
};
