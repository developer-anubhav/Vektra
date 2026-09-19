import Company from "../models/Company.js";
import { getAttendanceRecords } from "../utils/attendanceAdapter.js";

// GET ATTENDANCE REPORT
export const getAttendanceReport = async (req, res) => {
  try {
    const company = await Company.findById(req.user.companyId);
    const attendanceList = await getAttendanceRecords(req.user.companyId, {}, { sort: { date: -1 } });
    
    const enriched = attendanceList.map(att => {
        const emp = company?.employees.id(att.employeeId);
        const obj = att.toObject ? att.toObject() : att;
        return {
            ...obj,
            employee: emp ? { _id: emp._id, name: emp.name, employeeId: emp.employeeId } : null
        };
    });

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// GET PAYROLL REPORT
export const getPayrollReport = async (req, res) => {
  try {
    const company = await Company.findById(req.user.companyId);
    
    const sorted = [...company.payrolls].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const enriched = sorted.map(pay => {
        const emp = company.employees.id(pay.employeeId);
        return {
            ...pay.toObject(),
            employee: emp ? { _id: emp._id, name: emp.name, employeeId: emp.employeeId } : null
        };
    });

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// GET DASHBOARD STATS
export const getDashboardStats = async (req, res) => {
  try {
    const company = await Company.findById(req.user.companyId);
    if (!company) return res.status(404).json({ message: "Company not found" });

    // TOTAL EMPLOYEES (ACTIVE ONLY)
    const totalEmployees = company.employees.filter(emp => emp.status === 'Active').length;

    // TODAY DATE RANGE
    const now = new Date();
    const todayStartUtc = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)).getTime();
    const todayEndUtc = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)).getTime();

    // PRESENT / ABSENT TODAY
    const allAttendance = await getAttendanceRecords(req.user.companyId);
    const dailyAttendance = allAttendance.filter(att => {
        const attTime = new Date(att.date).getTime();
        return attTime >= todayStartUtc && attTime <= todayEndUtc;
    });

    const presentToday = dailyAttendance.filter(att => att.status === 'Present').length;
    const absentToday = dailyAttendance.filter(att => att.status === 'Absent').length;

    // CURRENT MONTH RANGE
    const firstDay = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1)).getTime();
    const lastDay = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)).getTime();

    // MONTHLY PAYROLL
    const monthlyPayroll = company.payrolls
        .filter(pay => {
            const payTime = new Date(pay.createdAt).getTime();
            return payTime >= firstDay && payTime <= lastDay;
        })
        .reduce((sum, pay) => sum + (pay.netSalary || 0), 0);

    res.json({
      totalEmployees,
      presentToday,
      absentToday,
      monthlyPayroll
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// GET ATTENDANCE SUMMARY
export const getAttendanceSummary = async (req, res) => {
  try {
    const now = new Date();
    const todayStartUtc = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)).getTime();
    const todayEndUtc = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)).getTime();

    const allAttendance = await getAttendanceRecords(req.user.companyId);
    const dailyAtt = allAttendance.filter(att => {
        const attTime = new Date(att.date).getTime();
        return attTime >= todayStartUtc && attTime <= todayEndUtc;
    });

    const counts = dailyAtt.reduce((acc, att) => {
        acc[att.status] = (acc[att.status] || 0) + 1;
        return acc;
    }, {});

    const summary = Object.keys(counts).map(status => ({
        _id: status,
        count: counts[status]
    }));

    res.json(summary);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// GET EMPLOYEE STATUS
export const getEmployeeStatus = async (req, res) => {
  try {
    const company = await Company.findById(req.user.companyId);
    
    const active = company.employees.filter(emp => emp.status === "Active").length;
    const inactive = company.employees.filter(emp => emp.status === "Inactive").length;

    res.json({ active, inactive });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// GET HEADCOUNT & ATTENDANCE CHART DATA
export const getHeadcountChart = async (req, res) => {
  try {
    const company = await Company.findById(req.user.companyId);
    
    const active = company.employees.filter(emp => emp.status === "Active").length;
    const inactive = company.employees.filter(emp => emp.status === "Inactive").length;

    res.json({
      labels: ["Active", "Inactive"],
      data: [active, inactive]
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export const getAttendanceChart = async (req, res) => {
  try {
    const now = new Date();
    const todayStartUtc = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)).getTime();
    const todayEndUtc = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)).getTime();

    const allAttendance = await getAttendanceRecords(req.user.companyId);
    const dailyAtt = allAttendance.filter(att => {
        const attTime = new Date(att.date).getTime();
        return attTime >= todayStartUtc && attTime <= todayEndUtc;
    });

    const present = dailyAtt.filter(att => att.status === "Present").length;
    const absent = dailyAtt.filter(att => att.status === "Absent").length;
    const leave = dailyAtt.filter(att => att.status === "Leave").length;

    res.json({
      labels: ["Present", "Absent", "Leave"],
      data: [present, absent, leave]
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}