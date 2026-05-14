import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const parseBoolean = (value: unknown, fallback: boolean) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  return String(value).toLowerCase() === "true";
};

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  MONGO_URI: z.string().min(1).default("mongodb://127.0.0.1:27017/corecart"),
  MONGO_FALLBACK_URI: z.string().min(1).default("mongodb://127.0.0.1:27017/corecart"),
  DB_FALLBACK_TO_LOCAL: z.preprocess((value) => parseBoolean(value, true), z.boolean()),
  REDIS_URL: z.string().default(""),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default("1d"),
  CORS_ORIGIN: z.string().default("http://localhost:5174"),
  ENABLE_TRANSACTIONS: z.preprocess((value) => parseBoolean(value, false), z.boolean())
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error("Invalid environment:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
