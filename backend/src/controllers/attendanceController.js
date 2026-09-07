import Company from "../models/Company.js";
import User from "../models/userModel.js";
import sendEmail from "../utils/sendEmail.js";
import { syncAttendanceToCollection, deleteAttendanceFromCollection } from "../utils/attendanceSync.js";
import { getAttendanceRecords } from "../utils/attendanceAdapter.js";

// Mark Attendance
export const markAttendance = async (req, res) => {
  const { employee: employeeId, date, status } = req.body;
  
  try {
    const company = await Company.findById(req.user.companyId);
    if (!company) return res.status(404).json({ message: "Company not found" });

    // Validate employee exists in this company
    const employee = company.employees.id(employeeId);
    if (!employee) return res.status(404).json({ message: "Employee not found in this company" });

    // Parse date and normalize to midnight UTC for comparison
    const selectedDate = new Date(date);
    selectedDate.setUTCHours(0, 0, 0, 0);

    // Check if attendance already exists for this day
    const existing = company.attendance.find(att => 
        att.employeeId.toString() === employeeId && 
        new Date(att.date).setUTCHours(0,0,0,0) === selectedDate.getTime()
    );

    if (existing) {
      const oldStatus = existing.status;
      existing.status = status;
      
      if (oldStatus !== "Absent" && status === "Absent") {
        await sendEmail({
            email: employee.email,
            subject: "Attendance Notification: Marked Absent",
            message: `Dear ${employee.name},\n\nYou have been marked as absent for ${selectedDate.toLocaleDateString()}.\n\nRegards,\nHR Department`
        });
      }
      
      await company.save();
      await syncAttendanceToCollection(company._id, existing);
      return res.json(existing);
    }

    // Create new attendance record
    const newAttendance = {
        employeeId,
        date: selectedDate,
        status
    };

    company.attendance.push(newAttendance);
    
    if (status === "Absent") {
        await sendEmail({
            email: employee.email,
            subject: "Attendance Notification: Marked Absent",
            message: `Dear ${employee.name},\n\nYou have been marked as absent for ${selectedDate.toLocaleDateString()}.\n\nRegards,\nHR Department`
        });
    }

    await company.save();
    const savedRec = company.attendance[company.attendance.length - 1];
    await syncAttendanceToCollection(company._id, savedRec);
    res.status(201).json(savedRec);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// Get Attendance Records
export const getAttendance = async (req, res) => {
  try {
    const company = await Company.findById(req.user.companyId);
    const attendanceRecords = await getAttendanceRecords(req.user.companyId, {}, { sort: { date: -1 } });
    
    // Manually "populate" employee info since they are in the same doc
    const enrichedRecords = attendanceRecords.map(att => {
        const emp = company?.employees.id(att.employeeId);
        const obj = att.toObject ? att.toObject() : att;
        return {
            ...obj,
            employee: emp ? { _id: emp._id, name: emp.name, employeeId: emp.employeeId } : null
        };
    });

    res.json(enrichedRecords);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// Update Attendance (Directly by ID)
export const updateAttendance = async (req, res) => {
  try {
    const company = await Company.findById(req.user.companyId);
    const attendance = company.attendance.id(req.params.id);

    if (!attendance) return res.status(404).json({ message: "Attendance record not found" });

    const oldStatus = attendance.status;
    const newStatus = req.body.status;
    
    attendance.status = newStatus;

    if (oldStatus !== "Absent" && newStatus === "Absent") {
      const emp = company.employees.id(attendance.employeeId);
      if (emp) {
        await sendEmail({
          email: emp.email,
          subject: "Attendance Notification: Marked Absent",
          message: `Dear ${emp.name},\n\nYou have been marked as absent for ${new Date(attendance.date).toLocaleDateString()}.\n\nRegards,\nHR Department`
        });
      }
    }

    await company.save();
    await syncAttendanceToCollection(company._id, attendance);
    res.json(attendance);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// Delete Attendance
export const deleteAttendance = async (req, res) => {
  try {
    const company = await Company.findById(req.user.companyId);
    const attendance = company.attendance.id(req.params.id);
    
    if (!attendance) return res.status(404).json({ message: "Record not found" });
    
    const copyAtt = attendance.toObject ? attendance.toObject() : { ...attendance };
    attendance.deleteOne();
    await company.save();
    await deleteAttendanceFromCollection(company._id, copyAtt);
    res.json({ message: "Attendance record deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// Get Company Shift Settings
export const getShiftSettings = async (req, res) => {
  try {
    const company = await Company.findById(req.user.companyId);
    if (!company) return res.status(404).json({ message: "Company not found" });

    return res.json(company.shiftSettings || {
      startTime: "09:00",
      endTime: "17:00",
      gracePeriodMinutes: 15,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// Update Company Shift Settings
export const updateShiftSettings = async (req, res) => {
  try {
    const { startTime, endTime, gracePeriodMinutes } = req.body;
    const company = await Company.findById(req.user.companyId);
    if (!company) return res.status(404).json({ message: "Company not found" });

    company.shiftSettings = {
      startTime: startTime || company.shiftSettings?.startTime || "09:00",
      endTime: endTime || company.shiftSettings?.endTime || "17:00",
      gracePeriodMinutes: Number(gracePeriodMinutes ?? company.shiftSettings?.gracePeriodMinutes ?? 15),
    };

    await company.save();
    return res.json({
      success: true,
      message: "Shift settings updated successfully",
      shiftSettings: company.shiftSettings,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// Employee Self-Check-in/out
export const checkIn = async (req, res) => {
  const { type } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const company = await Company.findById(req.user.companyId);
    if (!company) return res.status(404).json({ message: "Company not found" });

    const employee = company.employees.find(emp => emp.email.toLowerCase() === user.email.toLowerCase());
    if (!employee) return res.status(404).json({ message: "Employee profile not found" });

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const existingAttIndex = company.attendance.findIndex(
      (att) =>
        att.employeeId.toString() === employee._id.toString() &&
        new Date(att.date).setUTCHours(0, 0, 0, 0) === today.getTime()
    );

    let attRecord;
    const now = new Date();

    if (type === "CHECK_IN") {
      if (existingAttIndex >= 0) {
        attRecord = company.attendance[existingAttIndex];
        attRecord.checkInTime = attRecord.checkInTime || now;
      } else {
        attRecord = {
          employeeId: employee._id,
          date: today,
          checkInTime: now,
          checkOutTime: null,
          status: "Present",
          verificationMethod: "Manual"
        };
        company.attendance.push(attRecord);
        attRecord = company.attendance[company.attendance.length - 1];
      }
    } else if (type === "CHECK_OUT") {
      if (existingAttIndex >= 0) {
        attRecord = company.attendance[existingAttIndex];
        attRecord.checkOutTime = now;
      } else {
        return res.status(400).json({ message: "No check-in record found for today" });
      }
    } else {
      return res.status(400).json({ message: "Invalid check-in type" });
    }

    // Evaluate shift timings
    const startTimeStr = company.shiftSettings?.startTime || "09:00";
    const graceMinutes = company.shiftSettings?.gracePeriodMinutes || 15;
    
    const [startHours, startMinutes] = startTimeStr.split(":").map(Number);
    const shiftStart = new Date(attRecord.checkInTime);
    shiftStart.setHours(startHours, startMinutes, 0, 0);
    
    const checkInMs = new Date(attRecord.checkInTime).getTime();
    const shiftStartMs = shiftStart.getTime();
    const graceMs = graceMinutes * 60 * 1000;

    if (type === "CHECK_IN" && checkInMs > shiftStartMs + graceMs) {
      attRecord.status = "Late";
    }

    await company.save();
    await syncAttendanceToCollection(company._id, attRecord);
    res.json({ success: true, data: attRecord });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// Get Logged-in Employee Today Attendance Status
export const getTodayAttendance = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const company = await Company.findById(req.user.companyId);
    if (!company) return res.status(404).json({ message: "Company not found" });

    const employee = company.employees.find(emp => emp.email.toLowerCase() === user.email.toLowerCase());
    if (!employee) return res.status(404).json({ message: "Employee profile not found" });

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const record = company.attendance.find(
      (att) =>
        att.employeeId.toString() === employee._id.toString() &&
        new Date(att.date).setUTCHours(0, 0, 0, 0) === today.getTime()
    );

    res.json({ success: true, data: record || null });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

