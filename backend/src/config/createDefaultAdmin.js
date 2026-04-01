// backend/src/config/createDefaultAdmin.js
import User from "../models/User.js";

const createDefaultAdmin = async () => {
  try {
    const adminExists = await User.findOne({ role: "admin" });

    if (adminExists) {
      console.log("✅ Admin already exists");
      
      // ✅ UPDATE existing admin to ensure correct settings
      if (!adminExists.isApproved || !adminExists.isActive) {
        adminExists.isApproved = true;
        adminExists.isActive = true;
        await adminExists.save();
        console.log("✅ Admin updated: isApproved = true, isActive = true");
      }
      
      return;
    }

    // ✅ Create new admin with correct settings
    const newAdmin = await User.create({
      name: "Admin",
      email: "admin@gmail.com",
      password: "admin123",
      role: "admin",
      isApproved: true,  // ✅ Explicitly set
      isActive: true     // ✅ Explicitly set
    });

    console.log("✅ Default admin created successfully");
    console.log("📧 Email: admin@gmail.com");
    console.log("🔑 Password: admin123");
    
  } catch (error) {
    console.error("❌ Error creating default admin:", error);
  }
};

export default createDefaultAdmin;