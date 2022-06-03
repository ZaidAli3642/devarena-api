const knex = require("knex");

const db = knex({
  client: "pg",
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  connection: {
    host: process.env.DATABASE_HOST || "localhost",
    port: process.env.DATABASE_PORT || 5432,
    user: process.env.DATABASE_USER || "postgres",
    password: process.env.DATABASE_PASSWORD || "test",
    database: process.env.DATABASE_NAME || "devarena",
  },
});

module.exports = db;
