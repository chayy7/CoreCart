import mongoose from "mongoose";
import { env } from "./env.js";

export const connectDb = async () => {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000
  });
};

export const getDbHealth = () => {
  const states: Record<number, "disconnected" | "connected" | "connecting" | "disconnecting"> = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting"
  };
  return {
    state: states[mongoose.connection.readyState] ?? "disconnected",
    name: mongoose.connection.name || "unknown"
  };
};
