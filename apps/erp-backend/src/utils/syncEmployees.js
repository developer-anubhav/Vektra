import Company from "../models/Company.js";
import Employee from "../models/Employee.js";

export const syncEmployees = async () => {
  try {
    const companies = await Company.find({});
    let syncedCount = 0;

    for (const company of companies) {
      if (Array.isArray(company.employees)) {
        for (const emp of company.employees) {
          await Employee.updateOne(
            { _id: emp._id },
            {
              $set: {
                companyId: company._id,
                employeeId: emp.employeeId,
                name: emp.name,
                email: emp.email ? emp.email.toLowerCase().trim() : "",
                phoneNumber: emp.phoneNumber || "",
                department: emp.department,
                role: emp.role,
                monthlySalary: emp.monthlySalary || 0,
                status: emp.status || "Active",
                faceProfile: emp.faceProfile || {},
              },
            },
            { upsert: true }
          );
          syncedCount++;
        }
      }
    }
    console.log(`✅ Employees sync complete: ${syncedCount} employee document(s) populated in 'employees' collection.`);
  } catch (error) {
    console.error("❌ Error syncing employees collection:", error.message);
  }
};
