process.env.NODE_ENV = "test";
process.env.DATABASE_URL =
  "postgresql://postgres:postgres@127.0.0.1:5432/test_db";
process.env.CORS_ORIGIN = "*";
process.env.API_VERSION = "v1";