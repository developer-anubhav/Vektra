import Company from "../models/Company.js";

export const globalSearch = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.json({ employees: [], attendance: [], payroll: [] });
    }

    const company = await Company.findById(req.user.companyId);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    const query = q.toLowerCase();

    // 1. Search Employees
    const matchedEmployees = company.employees.filter(emp => 
      emp.name.toLowerCase().includes(query) || 
      emp.employeeId.toLowerCase().includes(query) ||
      emp.email.toLowerCase().includes(query) ||
      emp.department.toLowerCase().includes(query)
    ).slice(0, 5); // Limit to top 5 results

    const matchedEmployeeIds = new Set(matchedEmployees.map(e => e._id.toString()));

    // 2. Search Attendance (by status or matched employee)
    const matchedAttendance = company.attendance.filter(att => {
        const emp = company.employees.id(att.employeeId);
        const empName = emp ? emp.name.toLowerCase() : "";
        return att.status.toLowerCase().includes(query) || empName.includes(query);
    }).slice(0, 5).map(att => {
        const emp = company.employees.id(att.employeeId);
        return {
            ...att.toObject(),
            employeeName: emp ? emp.name : "Unknown"
        };
    });

    // 3. Search Payroll (by month or matched employee)
    const matchedPayroll = company.payrolls.filter(pay => {
        const emp = company.employees.id(pay.employeeId);
        const empName = emp ? emp.name.toLowerCase() : "";
        return pay.month.toLowerCase().includes(query) || empName.includes(query);
    }).slice(0, 5).map(pay => {
        const emp = company.employees.id(pay.employeeId);
        return {
            ...pay.toObject(),
            employeeName: emp ? emp.name : "Unknown"
        };
    });

    res.json({
      employees: matchedEmployees,
      attendance: matchedAttendance,
      payroll: matchedPayroll
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
