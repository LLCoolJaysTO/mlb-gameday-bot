// db.js — disabled for Render deployment (no database)
console.log("⚠️  Database connection skipped. Using dummy pool.");

module.exports = {
  connect: async () => ({
    query: () => ({}),
    release: () => {},
  }),
};
