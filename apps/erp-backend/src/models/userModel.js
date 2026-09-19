import mongoose from "mongoose"

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },

  password: {
    type: String,
    required: true
  },

  role: {
    type: String,
    enum: ["SUPERADMIN", "ADMIN", "HR", "MANAGER", "EMPLOYEE"],
    default: "EMPLOYEE"
  },
  
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: false // Optional for superadmins, required for HR/Managers
  },

  resetPasswordToken: {
    type: String,
    select: false
  },

  resetPasswordExpiry: {
    type: Date,
    select: false
  }
}, {
  timestamps: true
})

export default mongoose.model("User", userSchema)
