import http from "node:http";
import { Server } from "socket.io";
import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";
import { connectRedis } from "./config/redis.js";
import { app } from "./server.js";
import { getDbHealth } from "./config/db.js";

const DB_RETRY_INTERVAL_MS = 15000;

const connectDbSafely = async () => {
  if (getDbHealth().state !== "disconnected") {
    return;
  }

  try {
    await connectDb();
    // eslint-disable-next-line no-console
    console.log("MongoDB connected");
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("MongoDB connect attempt failed:", error);
  }
};

const bootstrap = async () => {
  await connectRedis();

  const server = http.createServer(app);

  const io = new Server(server, {
    cors: {
      origin: env.CORS_ORIGIN,
      methods: ["GET", "POST"]
    }
  });

  app.set("io", io);

  io.on("connection", (socket) => {
    socket.on("store:join", (storeId: string) => {
      socket.join(`store:${storeId}`);
    });
  });

  server.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`CoreCart API running on http://localhost:${env.PORT}`);
    // eslint-disable-next-line no-console
    console.log(`Transactions enabled: ${env.ENABLE_TRANSACTIONS ? "yes" : "no (standalone-safe mode)"}`);
    void connectDbSafely();
    setInterval(() => {
      void connectDbSafely();
    }, DB_RETRY_INTERVAL_MS);
  });
};

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Failed to bootstrap API", error);
  process.exit(1);
});
