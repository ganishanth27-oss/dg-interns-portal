/**
 * DG Interns Hub - Admin Account Creation Script
 *
 * Secure setup command to seed or update the platform Administrator.
 * Uses environment variables ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD.
 * Passwords are encrypted with bcrypt (salt rounds: 12).
 *
 * Usage:
 *   npm run seed:admin
 *   or:
 *   node server/seedAdmin.js
 */

const dns = require("dns");
try {
  const osDns = dns.getServers();
  if (osDns && osDns.length > 0 && osDns[0] !== "127.0.0.1") {
    dns.setServers(osDns);
  } else {
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
  }
} catch {
  // Use default resolver
}

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

const seedAdmin = async () => {
  const adminName = process.env.ADMIN_NAME || "DG Portal Administrator";
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@dginternshub.com").toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin@DGHub2026!";

  if (!process.env.MONGODB_URI) {
    console.error("❌ MONGODB_URI missing from .env file");
    process.exit(1);
  }

  if (adminPassword.length < 8) {
    console.error("❌ ADMIN_PASSWORD must be at least 8 characters long");
    process.exit(1);
  }

  try {
    console.log("🔌 Connecting to MongoDB Atlas...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB connected successfully.");

    let admin = await User.findOne({ email: adminEmail }).select("+password");

    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    if (admin) {
      console.log(`ℹ️ Existing user found for ${adminEmail}. Ensuring admin privileges...`);
      admin.name = adminName;
      admin.role = "admin";
      admin.password = hashedPassword;
      admin.isActive = true;
      await admin.save();
      console.log(`🎉 Admin account updated successfully!`);
    } else {
      admin = await User.create({
        name: adminName,
        email: adminEmail,
        password: hashedPassword,
        role: "admin",
        isActive: true,
      });
      console.log(`🎉 Admin account created successfully!`);
    }

    console.log(`----------------------------------------`);
    console.log(`👑 Role:      ${admin.role}`);
    console.log(`📧 Email:     ${admin.email}`);
    console.log(`👤 Name:      ${admin.name}`);
    console.log(`🔑 Password:  [Configured via ADMIN_PASSWORD]`);
    console.log(`----------------------------------------`);

    await mongoose.disconnect();
    console.log("👋 Disconnected cleanly from database.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Admin seed failed:", error.message);
    if (error.name === "MongooseServerSelectionError") {
      console.error(
        "💡 Atlas IP Whitelist Notice: Please ensure your current IP address is whitelisted in your MongoDB Atlas Network Access console."
      );
    }
    process.exit(1);
  }
};

seedAdmin();

