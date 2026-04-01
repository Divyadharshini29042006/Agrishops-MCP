// backend/src/server.js
import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import app from "./app.js";
import createDefaultAdmin from "./config/createDefaultAdMIN.js";
import { initOfferScheduler } from "./utils/offerScheduler.js";

mongoose
  .connect(process.env.MONGODB_URI, {
    // Connection options for better stability
    maxPoolSize: 10, // Maintain up to 10 socket connections
    serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
    family: 4 // Use IPv4, skip trying IPv6
  })
  .then(async () => {
    console.log("✅ MongoDB connected successfully");
    await createDefaultAdmin(); // 👈 IMPORTANT
    initOfferScheduler(); // 👈 NEW: Start daily offer activation/deactivation scheduler

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`👉 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1); // Exit if cannot connect to DB
  });
