import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import compression from "compression"; // ⚡️ NEW: for Gzip compression
import rateLimit from "express-rate-limit"; // 🔐 NEW: for rate limiting
import http from "http";
import { Server } from "socket.io";
import connectDB from "./config/DB.js";

// Import Routers
import userRouter from "./routes/userRouter.js";
import uploadRouter from "./routes/uploadRouters.js";
import faqRouter from "./routes/faqRouters.js";
import marqueeRouter from "./routes/marqueeRouter.js";
import notificaionRouter from "./routes/notificationRouters.js";
import courseRouter from "./routes/courseRoutes.js";
import admincourseRouter from "./routes/coursecontentRouter.js";
import blogRouter from "./routes/BlogRouter.js";
import subscriptionRouter from "./routes/subscriptionRoutes.js";
import analysisRouter from "./routes/analysisRouters.js";
import mainRouter from "./routes/mainRouters.js";
import couponsRouter from "./routes/couponRouters.js";
import groupchatsRouter from "./routes/groupChatRouter.js";
import ticketsRouter from "./routes/supportTicketRoutes.js";
import studentRouter from "./routes/studentcourserouter.js";
import courseCertificateRouter from "./routes/CourseCertificateRoutes.js";
import liveclassesRouter from "./routes/liveClassRouters.js";
import contactRouter from "./routes/contactRouters.js";
import interviewsRouter from "./routes/interviewRoutes.js";
import resumeRoutes from "./routes/resumeRouters.js";
import atsRoutes from "./routes/atsResumeCheckerRouters.js";
import roadmapsRoutes from "./routes/roadmapRoutes.js";
import adminDataRouter from "./routes/adminDataRouter.js";
import admincollaborationRouter from "./routes/collabRoutes/adminCollabRouter.js";

// Load environment variables from a .env file
dotenv.config();

// Connect to the database
connectDB();

// Initialize the Express app
const app = express();

// Create HTTP server and integrate Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  },
});

// ⚡️ Enable Gzip compression for all responses
app.use(compression());

// Protect against common web vulnerabilities
app.use(helmet());

// Enable Cross-Origin Resource Sharing for Express routes
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  })
);

// 1. Body parsing middleware must come first
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));

// Parse cookies with secure options in production
app.use(cookieParser());
app.use((req, res, next) => {
  if (req.cookies.token) {
    res.cookie("token", req.cookies.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
  }
  next();
});

// Use morgan for logging HTTP requests
app.use(morgan("dev"));

// 🔐 Implement Rate Limiting
// const apiLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // Max requests per IP per windowMs
//   message: "Too many requests from this IP, please try again after 15 minutes",
//   standardHeaders: true,
//   legacyHeaders: false,
// });
// app.use("/api/v1/", apiLimiter);

// 🔐 Implement a stricter rate limit for auth routes to prevent brute-force attacks
// const authLimiter = rateLimit({
//   windowMs: 10 * 60 * 1000, // 10 minutes
//   max: 5, // 5 requests per IP per windowMs
//   message:
//     "Too many authentication attempts from this IP, please try again after 10 minutes",
//   standardHeaders: true,
//   legacyHeaders: false,
// });
// app.use("/api/v1/auth", authLimiter);

// Attach the Socket.IO instance to the app for use in routes
app.set("io", io);

// --- Socket.IO Event Handling ---
// (Your existing Socket.IO logic remains unchanged)

io.on("connection", (socket) => {
  console.log(`User connected to main namespace: ${socket.id}`);
  socket.on("join_chat", (chatId) => {
    socket.join(chatId);
    console.log(`User ${socket.id} joined chat room: ${chatId}`);
  });
  socket.on("send_message", (data) => {
    console.log(
      `Message from ${data.senderId} to chat ${data.chatId}: ${data.content}`
    );
    io.to(data.chatId).emit("new_message", data);
  });
  socket.on("disconnect", () => {
    console.log(`User disconnected from main namespace: ${socket.id}`);
  });
});

const notificationsIo = io.of("/notifications");
notificationsIo.on("connection", (socket) => {
  console.log(`User connected to notifications namespace: ${socket.id}`);
  socket.on("join_notifications", (userId) => {
    socket.join(userId);
    console.log(
      `User ${socket.id} joined their private notification room: ${userId}`
    );
  });
  socket.on("disconnect", () => {
    console.log(`User disconnected from notifications namespace: ${socket.id}`);
  });
});

// --- Routes ---
// A simple test route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// ⚠️ Note: It is highly recommended to implement a robust input validation middleware
// like 'express-validator' or 'Joi' for all routes that accept user data (e.g., POST, PUT).

// Main user authentication routes
app.use("/api/v1/auth", userRouter);
app.use("/api/v1", uploadRouter);
app.use("/api/v1/faq", faqRouter);
app.use("/api/v1/marquee", marqueeRouter);
app.use("/api/v1/notifications", notificaionRouter);
app.use("/api/v1/courses", courseRouter);
app.use("/api/v1", admincourseRouter);
app.use("/api/v1/blogs", blogRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/dashboard", analysisRouter);
app.use("/api/v1", mainRouter);
app.use("/api/v1/coupons", couponsRouter);
app.use("/api/v1/groupchats", groupchatsRouter);
app.use("/api/v1/support-tickets", ticketsRouter);
app.use("/api/v1/student/courses", studentRouter);
app.use("/api/v1/certificates", courseCertificateRouter);
app.use("/api/v1/liveclasses", liveclassesRouter);
app.use("/api/v1/contact", contactRouter);
app.use("/api/v1/interview-preparations", interviewsRouter);
app.use("/api/v1/resumes", resumeRoutes);
app.use("/api/v1/ats", atsRoutes);
app.use("/api/v1/roadmaps", roadmapsRoutes);
app.use("/api/v1/admin/history", adminDataRouter);

//  collaboration routes
 app.use("/api/v1/admin/collab", admincollaborationRouter);

// --- Error Handling Middleware ---
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

// --- Server Startup ---
const PORT = process.env.PORT || 5000;

// Listen with the HTTP server, not directly with the Express app
server.listen(PORT, () => {
  console.log(
    `Server running in ${
      process.env.NODE_ENV || "development"
    } mode on port ${PORT}`
  );
});
