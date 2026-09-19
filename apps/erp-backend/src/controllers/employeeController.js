import mongoose from "mongoose";
import Company from "../models/Company.js";
import User from "../models/userModel.js";
import Employee from "../models/Employee.js";
import bcrypt from "bcryptjs";
import sendEmail from "../utils/sendEmail.js";

// Helper to get company with correct context
const getOwnCompany = async (reqUser) => {
    let company;
    const companyId = typeof reqUser === "string" ? reqUser : reqUser?.companyId;
    if (companyId && mongoose.Types.ObjectId.isValid(companyId)) {
        company = await Company.findById(companyId);
    }
    if (!company && typeof reqUser === "object" && reqUser?.id && mongoose.Types.ObjectId.isValid(reqUser.id)) {
        const userDoc = await User.findById(reqUser.id);
        if (userDoc?.companyId) {
            company = await Company.findById(userDoc.companyId);
        }
    }
    if (!company) {
        company = await Company.findOne();
    }
    if (!company) throw new Error("Company not found");
    return company;
};

export const createEmployee = async (req, res) => {
  try {
    if (req.user.role === "ADMIN") {
        return res.status(403).json({ message: "Admins cannot manage regular employees. Use the Manage Staff portal to manage HR and Managers." });
    }
    const company = await getOwnCompany(req.user);
    
    const { employeeId, name, email, phoneNumber, department, role, monthlySalary, status, password } = req.body;
    
    // Validate required fields
    if (!employeeId || !name || !email) {
        return res.status(400).json({ message: "employeeId, name, and email are required" });
    }

    // Validate role (from request body, default to EMPLOYEE)
    const allowedRoles = ["EMPLOYEE", "HR", "MANAGER"];
    const employeeRole = (role || "EMPLOYEE").toUpperCase();
    if (!allowedRoles.includes(employeeRole)) {
        return res.status(400).json({ message: "Invalid role. Allowed: EMPLOYEE, HR, MANAGER" });
    }

    // Normalize email once
    const normalizedEmail = email.toLowerCase().trim();
    
    // Check for duplicate employeeId within THIS company
    const existing = company.employees.find(emp => emp.employeeId === employeeId);
    if (existing) {
        return res.status(400).json({ message: "Employee ID already exists in your company" });
    }

    // Check for duplicate email within THIS company
    const existingEmail = company.employees.find(emp => emp.email === normalizedEmail);
    if (existingEmail) {
        return res.status(400).json({ message: "Email already exists in your company" });
    }

    // Check if user already exists in Auth collection
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
        return res.status(400).json({ message: "A user with this email already exists in the system" });
    }

    // Generate default password: username@Vektra (username = email prefix)
    const username = normalizedEmail.split('@')[0];
    const defaultPassword = `${username}@Vektra`;
    const finalPassword = password || defaultPassword;

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(finalPassword, salt);

    // 1. Add to Company Employees array
    const newEmployeeData = {
        employeeId,
        name,
        email: normalizedEmail,
        phoneNumber,
        department,
        role: employeeRole,
        monthlySalary,
        status: status || "Active"
    };
    company.employees.push(newEmployeeData);
    await company.save();

    const createdSubdoc = company.employees[company.employees.length - 1];

    // 2. Create standalone document in 'employees' collection in MongoDB
    const standaloneEmp = new Employee({
        _id: createdSubdoc._id,
        companyId: company._id,
        employeeId,
        name,
        email: normalizedEmail,
        phoneNumber,
        department,
        role: employeeRole,
        monthlySalary: monthlySalary || 0,
        status: status || "Active"
    });
    await standaloneEmp.save();

    // 3. Create User record for login (with compensating rollback on failure)
    let newUser;
    try {
        newUser = new User({
            name,
            email: normalizedEmail,
            password: hashedPassword,
            role: employeeRole,
            companyId: company._id
        });
        await newUser.save();
    } catch (userError) {
        // COMPENSATING TRANSACTION: Remove from Company array & standalone collection
        company.employees.pull({ _id: createdSubdoc._id });
        await company.save();
        await Employee.deleteOne({ _id: createdSubdoc._id });
        throw userError;
    }

    // 4. Send credentials email to employee (non-blocking)
    try {
      const emailSubject = "Welcome to Vektra - Your Login Credentials";
      const emailMessage = `Dear ${name},

Welcome to Vektra! Your employee account has been created by your HR department.

Your login credentials are:
- Email: ${normalizedEmail}
- Password: ${finalPassword}
- Portal: Employee Portal

Please log in at the Vektra Employee Portal and change your password after first login for security.

Best regards,
HR Team
Vektra`;

      await sendEmail({
        email: normalizedEmail,
        subject: emailSubject,
        message: emailMessage
      });
    } catch (emailError) {
      console.error("Failed to send credentials email:", emailError);
      // Don't fail the request if email fails
    }
    
    // Return the newly created employee with userId
    res.status(201).json({
      ...(createdSubdoc.toObject ? createdSubdoc.toObject() : createdSubdoc),
      userId: newUser._id,
      credentialsSent: true,
      defaultPasswordUsed: !password
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createStaff = async (req, res) => {
  try {
    const { name, email, employeeId, department, role, password } = req.body;
    if (typeof email !== "string" || email.trim() === "") {
        return res.status(400).json({ message: "Valid email is required" });
    }
    // Normalize email consistently: lowercase + trim
    const normalizedEmail = email.toLowerCase().trim();

    if (req.user.role !== "ADMIN") {
        return res.status(403).json({ message: "Only Admins can create HR or Managers" });
    }

    if (!["HR", "MANAGER", "EMPLOYEE"].includes(role)) {
        return res.status(400).json({ message: "Only HR, Manager, or Employee roles can be created here" });
    }

    const company = await getOwnCompany(req.user);
    
    // Check for duplicate employeeId or email within THIS company
    const existing = company.employees.find(emp => emp.employeeId === employeeId || emp.email === normalizedEmail);
    if (existing) {
        return res.status(400).json({ message: "Employee ID or Email already exists in your company" });
    }

    // Check if user already exists in Auth collection
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
        return res.status(400).json({ message: "A user with this email already exists" });
    }

    // 1. Add to Company Employees array
    company.employees.push({
        employeeId,
        name,
        email: normalizedEmail,
        department,
        role,
        status: "Active"
    });
    await company.save();

    const createdSubdoc = company.employees[company.employees.length - 1];

    // 2. Create standalone document in 'employees' collection in MongoDB
    const standaloneEmp = new Employee({
        _id: createdSubdoc._id,
        companyId: company._id,
        employeeId,
        name,
        email: normalizedEmail,
        department,
        role,
        status: "Active"
    });
    await standaloneEmp.save();

    // 3. Create User record for login
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password || "Vektra@2026", salt);

    const newUser = new User({
        name,
        email: normalizedEmail,
        password: hashedPassword,
        role,
        companyId: company._id
    });
    await newUser.save();
    
    res.status(201).json(createdSubdoc);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getEmployees = async (req, res) => {
  try {
    const { department, search } = req.query;
    const company = await getOwnCompany(req.user);
    
    let employees = company.employees || [];

    // Filter by department if provided
    if (department) {
      employees = employees.filter(emp => emp?.department === department);
    }

    // Filter by search query (name, ID, email, department, role) if provided
    if (search) {
      const query = search.toLowerCase().trim();
      employees = employees.filter(emp => 
        (emp?.name && emp.name.toLowerCase().includes(query)) || 
        (emp?.employeeId && emp.employeeId.toLowerCase().includes(query)) ||
        (emp?.email && emp.email.toLowerCase().includes(query)) ||
        (emp?.department && emp.department.toLowerCase().includes(query)) ||
        (emp?.role && emp.role.toLowerCase().includes(query))
      );
    }
    
    res.json(employees);
  } catch (err) {
    console.error("Get Employees Error:", err);
    res.status(500).json({ message: err.message });
  }
};

export const getEmployeeById = async (req, res) => {
  try {
    const company = await getOwnCompany(req.user);
    const employee = company.employees.id(req.params.id);
    
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }
    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateEmployee = async (req, res) => {
  try {
    const company = await getOwnCompany(req.user);
    const employee = company.employees.id(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const oldEmail = employee.email ? employee.email.toLowerCase().trim() : "";

    // Prepare update data
    const updateData = { ...req.body };
    if (updateData.email) {
      updateData.email = updateData.email.toLowerCase().trim();
    }

    // Update subdocument
    Object.assign(employee, updateData);
    await company.save();

    // Also update standalone 'employees' collection
    await Employee.updateOne({ _id: req.params.id }, { $set: updateData });

    // Also update corresponding 'users' collection record
    const targetEmail = oldEmail || updateData.email;
    if (targetEmail) {
      const userDoc = await User.findOne({ email: targetEmail });
      if (userDoc) {
        if (updateData.name) userDoc.name = updateData.name;
        if (updateData.email) userDoc.email = updateData.email;
        if (updateData.role) userDoc.role = updateData.role;
        if (updateData.password && String(updateData.password).trim() !== "") {
          const salt = await bcrypt.genSalt(10);
          userDoc.password = await bcrypt.hash(String(updateData.password).trim(), salt);
        }
        await userDoc.save();
      }
    }

    res.json(employee);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteEmployee = async (req, res) => {
  try {
    const company = await getOwnCompany(req.user);
    
    // Remove the employee subdocument
    const employee = company.employees.id(req.params.id);
    if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
    }

    const targetEmail = employee.email ? employee.email.toLowerCase().trim() : "";
    
    employee.deleteOne(); // Mongoose subdocument method
    
    // Also cleanup linked attendance and payrolls within the same document
    company.attendance = company.attendance.filter(att => att.employeeId?.toString() !== req.params.id);
    company.payrolls = company.payrolls.filter(pay => pay.employeeId?.toString() !== req.params.id);

    await company.save();

    // Also delete from standalone 'employees' collection
    await Employee.deleteOne({ _id: req.params.id });

    // Also delete from 'users' collection so auth user is purged
    if (targetEmail) {
      await User.deleteOne({ email: targetEmail });
    }

    res.json({ message: "Employee and related records deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
