const http = require("http");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const os = require("os");
require("dotenv").config();

const connectDB = require("./config/db");
const rateLimiter = require("./middleware/rateLimiter");
const { initializeSocket } = require("./config/socket");
const { getWorker } = require("./config/mediasoup");

const app = express();
const path = require("path");

// Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
); // Security headers (includes XSS protection)
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        process.env.FRONTEND_URL || "http://localhost:3000",
        "https://healiinnx.vercel.app",
        "https://www.healiinnx.vercel.app",
        "https://heallyn.vercel.app",
        "https://www.heallyn.vercel.app",
      ];

      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        return callback(null, true);
      }

      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        // In development, allow localhost origins
        if (
          process.env.NODE_ENV !== "production" &&
          (origin.includes("localhost") || origin.includes("127.0.0.1"))
        ) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      }
    },
    credentials: true,
  })
);
app.use(morgan("dev")); // Logging
app.use(express.json({ limit: "10mb" })); // Parse JSON bodies with size limit
app.use(express.urlencoded({ extended: true, limit: "10mb" })); // Parse URL-encoded bodies with size limit
app.use(cookieParser()); // Parse cookies
app.use(rateLimiter); // General rate limiting

// Serve static files from upload directory with CORS headers
app.use(
  "/uploads",
  (req, res, next) => {
    const origin = req.headers.origin;
    const allowedOrigins = [
      process.env.FRONTEND_URL || "http://localhost:3000",
      "https://healiinnx.vercel.app",
      "https://www.healiinnx.vercel.app",
      "https://heallyn.vercel.app",
      "https://www.heallyn.vercel.app",
    ];

    if (allowedOrigins.includes(origin) || !origin) {
      res.header("Access-Control-Allow-Origin", origin || allowedOrigins[0]);
      res.header("Access-Control-Allow-Credentials", "true");
      res.header("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
      res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    }

    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }

    next();
  },
  express.static(path.join(__dirname, "upload"), {
    maxAge: "1y", // Cache for 1 year
    etag: true,
    setHeaders: (res, path) => {
      res.set("Cross-Origin-Resource-Policy", "cross-origin");
    },
  })
);

// Connect to database
connectDB().then(() => {
  const { initCommissionRates } = require("./utils/commissionConfig");
  initCommissionRates();
});

// Auto-create/update admin for debugging
(async () => {
  try {
    const Admin = require("./models/Admin");
    const email = "admin@gmail.com";
    const password = "12345678";

    let admin = await Admin.findOne({ email });
    if (!admin) {

      await Admin.create({
        name: "Admin User",
        email,
        password,
        isSuperAdmin: true,
        isActive: true,
      });

    } else {
      const isMatch = await admin.comparePassword(password);
      if (!isMatch) {

        admin.password = password;
        await admin.save();

      }
    }
  } catch (error) {
    console.error("❌ Failed to create/update default admin:", error.message);
  }
})();

// Initialize mediasoup worker
(async () => {
  try {
    await getWorker();

  } catch (error) {
    console.error("❌ Failed to initialize mediasoup worker:", error);
  }
})();

// Request Logging Middleware for debugging
app.use((req, res, next) => {

  next();
});

// Auth Routes
app.use("/api/patients/auth", require("./routes/patient-routes/auth.routes"));
app.use("/api/doctors/auth", require("./routes/doctor-routes/auth.routes"));
app.use(
  "/api/laboratories/auth",
  require("./routes/laboratory-routes/auth.routes")
);
app.use(
  "/api/pharmacies/auth",
  require("./routes/pharmacy-routes/auth.routes")
);
app.use("/api/nurses/auth", require("./routes/nurse-routes/auth.routes"));
app.use(
  "/api/nurses/notifications",
  require("./routes/nurse-routes/notification.routes")
);
app.use("/api/nurses/wallet", require("./routes/nurse-routes/wallet.routes"));
app.use(
  "/api/nurses/support",
  require("./routes/nurse-routes/support.routes")
);
app.use("/api/admin/auth", require("./routes/admin-routes/auth.routes"));

// Patient Routes (Profile is handled in auth.routes.js)
app.use(
  "/api/patients/dashboard",
  require("./routes/patient-routes/dashboard.routes")
);
app.use(
  "/api/patients/upload",
  require("./routes/patient-routes/upload.routes")
);
app.use(
  "/api/patients/appointments",
  require("./routes/patient-routes/appointment.routes")
);
app.use(
  "/api/patients/consultations",
  require("./routes/patient-routes/consultation.routes")
);
app.use(
  "/api/patients/doctors",
  require("./routes/patient-routes/doctor.routes")
);
app.use(
  "/api/patients/nurses",
  require("./routes/patient-routes/nurse.routes")
);
app.use(
  "/api/patients",
  require("./routes/patient-routes/prescription.routes")
);
app.use(
  "/api/patients/orders",
  require("./routes/patient-routes/order.routes")
);
app.use(
  "/api/patients/transactions",
  require("./routes/patient-routes/transaction.routes")
);
app.use(
  "/api/patients/history",
  require("./routes/patient-routes/history.routes")
);
app.use(
  "/api/patients/requests",
  require("./routes/patient-routes/request.routes")
);
app.use(
  "/api/patients/reviews",
  require("./routes/patient-routes/review.routes")
);
app.use(
  "/api/patients/support",
  require("./routes/patient-routes/support.routes")
);
app.use(
  "/api/patients/notifications",
  require("./routes/patient-routes/notification.routes")
);
app.use(
  "/api/patients/blogs",
  require("./routes/patient-routes/blog.routes")
);

// Doctor Routes (Profile is handled in auth.routes.js)
app.use(
  "/api/doctors/dashboard",
  require("./routes/doctor-routes/dashboard.routes")
);
app.use("/api/doctors/upload", require("./routes/doctor-routes/upload.routes"));
app.use(
  "/api/doctors/patients",
  require("./routes/doctor-routes/patient.routes")
);
app.use(
  "/api/doctors/consultations",
  require("./routes/doctor-routes/consultation.routes")
);
app.use(
  "/api/doctors/prescriptions",
  require("./routes/doctor-routes/prescription.routes")
);
app.use(
  "/api/doctors/appointments",
  require("./routes/doctor-routes/appointment.routes")
);
app.use(
  "/api/doctors/sessions",
  require("./routes/doctor-routes/session.routes")
);
app.use("/api/doctors/queue", require("./routes/doctor-routes/queue.routes"));
app.use(
  "/api/doctors/availability",
  require("./routes/doctor-routes/availability.routes")
);
app.use(
  "/api/doctors/reviews",
  require("./routes/doctor-routes/review.routes")
);
app.use("/api/doctors/wallet", require("./routes/doctor-routes/wallet.routes"));
app.use(
  "/api/doctors/support",
  require("./routes/doctor-routes/support.routes")
);
app.use(
  "/api/doctors/notifications",
  require("./routes/doctor-routes/notification.routes")
);

// Pharmacy Routes (Profile is handled in auth.routes.js)
app.use(
  "/api/pharmacy/dashboard",
  require("./routes/pharmacy-routes/dashboard.routes")
);
app.use(
  "/api/pharmacy/upload",
  require("./routes/pharmacy-routes/upload.routes")
);
app.use(
  "/api/pharmacy/orders",
  require("./routes/pharmacy-routes/order.routes")
);
app.use(
  "/api/pharmacy/medicines",
  require("./routes/pharmacy-routes/medicine.routes")
);
app.use(
  "/api/pharmacy/patients",
  require("./routes/pharmacy-routes/patient.routes")
);
app.use(
  "/api/pharmacy/request-orders",
  require("./routes/pharmacy-routes/request-order.routes")
);
app.use(
  "/api/pharmacy/prescriptions",
  require("./routes/pharmacy-routes/prescription.routes")
);
app.use(
  "/api/pharmacy/services",
  require("./routes/pharmacy-routes/service.routes")
);
app.use(
  "/api/pharmacy/wallet",
  require("./routes/pharmacy-routes/wallet.routes")
);
app.use(
  "/api/pharmacy/support",
  require("./routes/pharmacy-routes/support.routes")
);
app.use(
  "/api/pharmacy/notifications",
  require("./routes/pharmacy-routes/notification.routes")
);

// Laboratory Routes (Profile is handled in auth.routes.js)
app.use(
  "/api/laboratory/dashboard",
  require("./routes/laboratory-routes/dashboard.routes")
);
app.use(
  "/api/laboratory/upload",
  require("./routes/laboratory-routes/upload.routes")
);
app.use("/api/labs/leads", require("./routes/laboratory-routes/order.routes"));
app.use(
  "/api/laboratory/tests",
  require("./routes/laboratory-routes/test.routes")
);
app.use(
  "/api/laboratory/reports",
  require("./routes/laboratory-routes/report.routes")
);
app.use(
  "/api/laboratory/patients",
  require("./routes/laboratory-routes/patient.routes")
);
app.use(
  "/api/laboratory/request-orders",
  require("./routes/laboratory-routes/request-order.routes")
);
app.use(
  "/api/laboratory/requests",
  require("./routes/laboratory-routes/requests.routes")
);
app.use(
  "/api/laboratory/wallet",
  require("./routes/laboratory-routes/wallet.routes")
);
app.use(
  "/api/laboratory/support",
  require("./routes/laboratory-routes/support.routes")
);
app.use(
  "/api/laboratory/notifications",
  require("./routes/laboratory-routes/notification.routes")
);

// Admin Routes
app.use("/api/admin", require("./routes/admin-routes/providers.routes"));
app.use("/api/admin", require("./routes/admin-routes/users.routes"));
app.use(
  "/api/admin/dashboard",
  require("./routes/admin-routes/dashboard.routes")
);
app.use("/api/admin/requests", require("./routes/admin-routes/request.routes"));
app.use(
  "/api/admin/appointments",
  require("./routes/admin-routes/appointment.routes")
);
app.use("/api/admin/orders", require("./routes/admin-routes/order.routes"));
app.use(
  "/api/admin/inventory",
  require("./routes/admin-routes/inventory.routes")
);
app.use("/api/admin/wallet", require("./routes/admin-routes/wallet.routes"));
app.use("/api/admin/revenue", require("./routes/admin-routes/revenue.routes"));
app.use(
  "/api/admin/settings",
  require("./routes/admin-routes/settings.routes")
);
app.use("/api/admin/support", require("./routes/admin-routes/support.routes"));
app.use(
  "/api/admin/verifications",
  require("./routes/admin-routes/verification.routes")
);
app.use(
  "/api/admin/pharmacy-medicines",
  require("./routes/admin-routes/pharmacy-medicines.routes")
);
app.use(
  "/api/admin/notifications",
  require("./routes/admin-routes/notification.routes")
);
app.use(
  "/api/admin/blogs",
  require("./routes/admin-routes/blog.routes")
);

// Public Routes (Discovery)
app.use(
  "/api/pharmacies",
  require("./routes/patient-routes/pharmacy-discovery.routes")
);
app.use(
  "/api/laboratories",
  require("./routes/patient-routes/laboratory-discovery.routes")
);
app.use(
  "/api/specialties",
  require("./routes/patient-routes/specialty.routes")
);

app.get("/", (req, res) => {
  res.json({
    message: "Healiinn Backend API",
    status: "running",
    version: "1.0.0",
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

// All API routes are configured above

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  const status = err.status || 500;

  // Silently handle 401 errors (authentication failures are expected after logout)
  // Only log non-401 errors or if in development mode
  if (status !== 401 || process.env.NODE_ENV === "development") {
    if (status === 401) {
      // Log 401 errors only in development with less verbosity

    } else {
      // Log other errors normally
      console.error("Error:", err);
    }
  }

  res.status(status).json({
    success: false,
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Initialize Socket.IO for real-time updates
initializeSocket(server);

// Listen on all network interfaces (0.0.0.0) to allow network access
server.listen(PORT, "0.0.0.0", () => {
  const networkInterfaces = os.networkInterfaces();
  const addresses = [];

  // Get localhost address
  addresses.push(`http://localhost:${PORT}`);
  addresses.push(`http://127.0.0.1:${PORT}`);

  // Get network IP addresses
  Object.keys(networkInterfaces).forEach((interfaceName) => {
    networkInterfaces[interfaceName].forEach((iface) => {
      // Skip internal (loopback) and non-IPv4 addresses
      // Handle both string 'IPv4' and number 4 (Windows compatibility)
      const isIPv4 = iface.family === "IPv4" || iface.family === 4;
      if (isIPv4 && !iface.internal) {
        const address = `http://${iface.address}:${PORT}`;
        // Avoid duplicates
        if (!addresses.includes(address)) {
          addresses.push(address);
        }
      }
    });
  });



  addresses.forEach((address) => {

  });

});

module.exports = app;
