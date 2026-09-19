import User from "../models/userModel.js"
import Company from "../models/Company.js"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import crypto from "crypto"
import sendEmail from "../utils/sendEmail.js"

export const loginUser = async (req, res) => {
  const { email, password } = req.body

  try {
    const searchEmail = email.toLowerCase().trim()
    const user = await User.findOne({ email: searchEmail })
    
    if (!user) {
      return res.status(400).json({ message: "User not found" })
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" })

    const token = jwt.sign(
      { id: user._id, role: user.role, companyId: user.companyId },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    )

    res.json({
      token,
      role: user.role,
      name: user.name,
      companyId: user.companyId
    })

  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}


export const organizationSignup = async (req, res) => {
  const { companyName, name, email, password } = req.body

  try {
    if (!companyName || !name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" })
    }

    const normalizedEmail = email.toLowerCase().trim()
    if (typeof companyName !== "string") {
      return res.status(400).json({ message: "Invalid company name" })
    }
    const normalizedCompanyName = companyName.trim()
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail })
    if (existingUser) {
      return res.status(400).json({ message: "User with this email already exists" })
    }

    // Check if company already exists
    const existingCompany = await Company.findOne({ name: { $eq: normalizedCompanyName } })
    if (existingCompany) {
      return res.status(400).json({ message: "Company name already registered" })
    }

 // 1. Create Company with Pending status
    const newCompany = new Company({
      name: normalizedCompanyName,
      email: normalizedEmail,
      adminName: name,
      status: "Pending"
    })
    await newCompany.save()

    // 2. Create Admin User
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    const newAdmin = new User({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: "ADMIN",
      companyId: newCompany._id
    })
    await newAdmin.save()

    res.status(201).json({ 
      success: true, 
      message: "Organization registered successfully! You can now log in.",
      data: {
        company: newCompany.name,
        admin: newAdmin.name
      }
    })

  } catch (err) {
    console.error("Org Signup Error:", err)
    res.status(500).json({ message: err.message })
  }
}

export const forgotPassword = async (req, res) => {
  const { email } = req.body

  try {
    const normalizedEmail = email.toLowerCase().trim()
    const user = await User.findOne({ email: normalizedEmail })
    
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({ message: "If the email exists, a password reset link has been sent." })
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex")
    const resetTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex")
    const resetTokenExpiry = Date.now() + 3600000 // 1 hour

    user.resetPasswordToken = resetTokenHash
    user.resetPasswordExpiry = resetTokenExpiry
    await user.save()

    // Send reset email
    const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${resetToken}&email=${encodeURIComponent(normalizedEmail)}`
    
    const emailSubject = "Vektra - Password Reset Request"
    const emailMessage = `Dear ${user.name},

You requested a password reset for your Vektra account.

Click the link below to reset your password (valid for 1 hour):
${resetUrl}

If you didn't request this, please ignore this email.

Best regards,
Vektra Team`

    await sendEmail({
      email: normalizedEmail,
      subject: emailSubject,
      message: emailMessage
    })

    res.json({ message: "If the email exists, a password reset link has been sent." })
  } catch (err) {
    console.error("Forgot password error:", err)
    res.status(500).json({ message: "Failed to process request. Please try again." })
  }
}

export const resetPassword = async (req, res) => {
  const { token, email, password } = req.body

  try {
    const normalizedEmail = email.toLowerCase().trim()
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex")
    
    const user = await User.findOne({
      email: normalizedEmail,
      resetPasswordToken: tokenHash,
      resetPasswordExpiry: { $gt: Date.now() }
    })

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token" })
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    user.password = hashedPassword
    user.resetPasswordToken = undefined
    user.resetPasswordExpiry = undefined
    await user.save()

    res.json({ message: "Password reset successful. You can now log in with your new password." })
  } catch (err) {
    console.error("Reset password error:", err)
    res.status(500).json({ message: "Failed to reset password. Please try again." })
  }
}

export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect current password" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

