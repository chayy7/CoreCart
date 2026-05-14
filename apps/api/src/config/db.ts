import mongoose from "mongoose";
import { env } from "./env.js";

const sanitizeMongoUri = (uri: string) => uri.replace(/\/\/([^:]+):([^@]+)@/, "//$1:***@");

const toErrorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));

const isAtlasUri = (uri: string) => uri.includes("mongodb.net");

const connect = async (uri: string) =>
  mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000
  });

export const connectDb = async () => {
  mongoose.set("strictQuery", true);
  const primaryUri = env.MONGO_URI.trim();

  try {
    await connect(primaryUri);
    return;
  } catch (primaryError) {
    const shouldFallback =
      env.NODE_ENV === "development" &&
      env.DB_FALLBACK_TO_LOCAL &&
      primaryUri !== env.MONGO_FALLBACK_URI;

    if (!shouldFallback) {
      const atlasHint = isAtlasUri(primaryUri)
        ? "If you need Atlas, whitelist your current IP in Atlas Network Access."
        : "";
      const localHint = primaryUri.includes("127.0.0.1") || primaryUri.includes("localhost")
        ? `Start local MongoDB at ${primaryUri} and retry.`
        : "";

      throw new Error(
        [
          `MongoDB connection failed for ${sanitizeMongoUri(primaryUri)}.`,
          toErrorMessage(primaryError),
          localHint,
          atlasHint
        ]
          .filter(Boolean)
          .join(" ")
      );
    }

    // eslint-disable-next-line no-console
    console.warn(
      `Primary MongoDB connection failed (${sanitizeMongoUri(primaryUri)}): ${toErrorMessage(primaryError)}`
    );
    // eslint-disable-next-line no-console
    console.warn(`Retrying with fallback MongoDB URI (${sanitizeMongoUri(env.MONGO_FALLBACK_URI)}).`);

    try {
      await connect(env.MONGO_FALLBACK_URI);
      return;
    } catch (fallbackError) {
      const atlasHint = isAtlasUri(primaryUri)
        ? "If you need Atlas, whitelist your current IP in Atlas Network Access."
        : "";
      throw new Error(
        [
          `MongoDB connection failed for primary and fallback URIs.`,
          `Primary: ${sanitizeMongoUri(primaryUri)} -> ${toErrorMessage(primaryError)}`,
          `Fallback: ${sanitizeMongoUri(env.MONGO_FALLBACK_URI)} -> ${toErrorMessage(fallbackError)}`,
          `Start local MongoDB at ${env.MONGO_FALLBACK_URI} or update MONGO_URI in apps/api/.env.`,
          atlasHint
        ]
          .filter(Boolean)
          .join(" ")
      );
    }
  }
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
