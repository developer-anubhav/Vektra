import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  mongoUri: process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://localhost:27017/vektra",
  jwtSecret: process.env.JWT_SECRET || "vektra_development_jwt_secret_change_in_production",
  internalServiceSecret: process.env.INTERNAL_SERVICE_SECRET || "vektra_internal_copilot_secret_2026",
  copilotServiceUrl: process.env.COPILOT_SERVICE_URL || "http://localhost:8001",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
};

export const validateEnv = () => {
  if (!process.env.INTERNAL_SERVICE_SECRET) {
    console.warn(
      "⚠️ [WARN] INTERNAL_SERVICE_SECRET is not set in environment. Using fallback development secret."
    );
  }
  return config;
};

export default config;
