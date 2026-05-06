import http from "node:http";
import { Server } from "socket.io";
import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";
import { connectRedis } from "./config/redis.js";
import { app } from "./server.js";

const bootstrap = async () => {
  await connectDb();
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
  });
};

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Failed to bootstrap API", error);
  const message =
    typeof error === "object" && error && "message" in error
      ? String((error as { message?: unknown }).message)
      : "";

  if (message.includes("ECONNREFUSED") || message.includes("Server selection timed out")) {
    // eslint-disable-next-line no-console
    console.error("MongoDB is not reachable at MONGO_URI. Start local MongoDB first and retry.");
  }
  process.exit(1);
});
