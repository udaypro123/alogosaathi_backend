import express from "express";
import cors from "cors"
import cookieParser from "cookie-parser";
import helmet from "helmet";

// ---- CORS ----
const app = express()

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));

app.use(express.json({ limit: '3mb' }));
app.use(express.urlencoded({ extended: true, limit: '3mb' }));
app.use(express.static('public'));
app.use(cookieParser());
app.use(helmet());

export { app }