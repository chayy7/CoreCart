import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { authRouter } from "./routes/authRoutes.js";
import { dashboardRouter } from "./routes/dashboardRoutes.js";
import { inventoryRouter } from "./routes/inventoryRoutes.js";
import { orderRouter } from "./routes/orderRoutes.js";
import { productRouter } from "./routes/productRoutes.js";
import { storeRouter } from "./routes/storeRoutes.js";
import { errorHandler, notFound } from "./middleware/error.js";
import { env } from "./config/env.js";
import { getDbHealth } from "./config/db.js";
import { getCacheHealth } from "./config/redis.js";

export const app = express();

app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true
  })
);
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  const db = getDbHealth();
  const cache = getCacheHealth();
  const healthy = db.state === "connected";

  res.status(healthy ? 200 : 503).json({
    status: healthy ? "ok" : "degraded",
    service: "corecart-api",
    db,
    cache,
    transactionsEnabled: env.ENABLE_TRANSACTIONS
  });
});

app.use("/api/auth", authRouter);
app.use("/api/products", productRouter);
app.use("/api/inventory", inventoryRouter);
app.use("/api/orders", orderRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/stores", storeRouter);

app.use(notFound);
app.use(errorHandler);
