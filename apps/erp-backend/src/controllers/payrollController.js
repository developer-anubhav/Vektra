import Company from "../models/Company.js";

export const createPayroll = async (req, res) => {
  try {
    const { employee: employeeId, month, basicSalary, allowances, deductions } = req.body;
    const company = await Company.findById(req.user.companyId);
    
    if (!company) return res.status(404).json({ message: "Company not found" });

    const netSalary = Number(basicSalary) + Number(allowances) - Number(deductions);

    const newPayroll = {
      employeeId,
      month,
      basicSalary,
      allowances,
      deductions,
      netSalary
    };

    company.payrolls.push(newPayroll);
    await company.save();

    res.status(201).json(company.payrolls[company.payrolls.length - 1]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export const getPayroll = async (req, res) => {
  try {
    const company = await Company.findById(req.user.companyId);
    
    const enrichedPayrolls = company.payrolls.map(pay => {
        const emp = company.employees.id(pay.employeeId);
        return {
            ...pay.toObject(),
            employee: emp ? { _id: emp._id, name: emp.name, employeeId: emp.employeeId } : null
        };
    });

    res.json(enrichedPayrolls);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export const updatePayroll = async (req, res) => {
  try {
    const { basicSalary, allowances, deductions } = req.body;
    const company = await Company.findById(req.user.companyId);
    const payroll = company.payrolls.id(req.params.id);

    if (!payroll) return res.status(404).json({ message: "Payroll record not found" });

    payroll.basicSalary = basicSalary;
    payroll.allowances = allowances;
    payroll.deductions = deductions;
    payroll.netSalary = Number(basicSalary) + Number(allowances) - Number(deductions);

    await company.save();
    res.json(payroll);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export const deletePayroll = async (req, res) => {
  try {
    const company = await Company.findById(req.user.companyId);
    const payroll = company.payrolls.id(req.params.id);
    
    if (!payroll) return res.status(404).json({ message: "Record not found" });
    
    payroll.deleteOne();
    await company.save();
    res.json({ message: "Payroll Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
