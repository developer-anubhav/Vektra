import Company from "../models/Company.js";
import sendEmail from "../utils/sendEmail.js";

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
    res.status(201).json(company.attendance[company.attendance.length - 1]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// Get Attendance Records
export const getAttendance = async (req, res) => {
  try {
    const company = await Company.findById(req.user.companyId);
    
    // Manually "populate" employee info since they are in the same doc
    const enrichedRecords = company.attendance.map(att => {
        const emp = company.employees.id(att.employeeId);
        return {
            ...att.toObject(),
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
    
    attendance.deleteOne();
    await company.save();
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

