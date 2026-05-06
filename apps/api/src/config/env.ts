import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  MONGO_URI: z.string().min(1).default("mongodb://127.0.0.1:27017/corecart"),
  REDIS_URL: z.string().default(""),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default("1d"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  ENABLE_TRANSACTIONS: z.preprocess(
    (value) => String(value ?? "false").toLowerCase() === "true",
    z.boolean()
  )
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error("Invalid environment:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
