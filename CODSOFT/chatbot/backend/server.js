import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";
import { createProxyMiddleware } from "http-proxy-middleware";

// Load environment variables
dotenv.config();

// Connect to MongoDB Database
connectDB();

const app = express();

// Security Middlewares
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);
app.use(
  cors({
    origin: "*", // Allows any origin in dev; can restrict to frontend URL in prod
    credentials: true,
  })
);

// Request Logger in Development
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Express Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150, // Limit each IP to 150 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many requests from this IP, please try again after 15 minutes",
  },
});
app.use("/api", limiter);

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api", chatRoutes);

// Proxy other routes to frontend dev server in development
const viteProxy = createProxyMiddleware({
  target: "http://localhost:8080",
  changeOrigin: true,
  ws: true, // proxy websockets for Vite HMR
});

// Forward any non-API requests to the frontend server
app.use((req, res, next) => {
  if (req.path.startsWith("/api")) {
    return next();
  }
  viteProxy(req, res, next);
});

// Fallback for 404 and global error handling middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`
  );
});
