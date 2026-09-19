import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import Company from "../src/models/Company.js";
import User from "../src/models/userModel.js";
import Employee from "../src/models/Employee.js";
import Project from "../src/models/Project.js";
import Task from "../src/models/Task.js";
import TaskUpdate from "../src/models/TaskUpdate.js";
import { createProjectService } from "../src/services/projectService.js";
import { createTaskService, updateTaskProgressService } from "../src/services/taskService.js";
import { getProjectAnalyticsService } from "../src/services/analyticsService.js";

const runTests = async () => {
  console.log("=== RUNNING PHASE 4 VERIFICATION TESTS ===");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connected to MongoDB for testing.");

  let passCount = 0;
  let failCount = 0;

  const assert = (condition, testName) => {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passCount++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failCount++;
    }
  };

  try {
    // 1. Setup Test Data (Company A)
    console.log("\n--- Setting up Test Data ---");
    const companyA = await Company.create({ name: "Phase4 Test Company A", email: "compA_p4@test.com", adminName: "Admin A", status: "Active" });
    const companyB = await Company.create({ name: "Phase4 Test Company B", email: "compB_p4@test.com", adminName: "Admin B", status: "Active" });

    const adminUserA = await User.create({ name: "Admin A", email: "adminA_p4@test.com", password: "hash", role: "ADMIN", companyId: companyA._id });
    const managerEmpA = await Employee.create({ companyId: companyA._id, employeeId: "EMP-A-M1", name: "Manager A1", email: "managerA1_p4@test.com", department: "Eng", role: "MANAGER" });
    const regularEmpA1 = await Employee.create({ companyId: companyA._id, employeeId: "EMP-A-E1", name: "Employee A1", email: "employeeA1_p4@test.com", department: "Eng", role: "EMPLOYEE" });

    const adminUserB = await User.create({ name: "Admin B", email: "adminB_p4@test.com", password: "hash", role: "ADMIN", companyId: companyB._id });

    // Create 2 Projects in Company A
    const projA1 = await createProjectService(
      {
        projectCode: "PRJ-HEALTH-G",
        name: "Green Health Project",
        priority: "HIGH",
        projectManager: managerEmpA._id,
        teamMembers: [regularEmpA1._id],
        startDate: new Date(Date.now() - 86400000 * 10),
        endDate: new Date(Date.now() + 86400000 * 20),
      },
      { id: adminUserA._id, companyId: companyA._id, role: "ADMIN" }
    );

    const projA2 = await createProjectService(
      {
        projectCode: "PRJ-HEALTH-R",
        name: "Red Health Project (Overdue)",
        priority: "HIGH",
        projectManager: managerEmpA._id,
        teamMembers: [regularEmpA1._id],
        startDate: new Date(Date.now() - 86400000 * 20),
        endDate: new Date(Date.now() - 86400000 * 2), // Past deadline!
      },
      { id: adminUserA._id, companyId: companyA._id, role: "ADMIN" }
    );

    // Create tasks for Project 1 (100% completion)
    const taskG1 = await createTaskService(
      {
        projectId: projA1._id,
        title: "Task 1 Green",
        assignedTo: [regularEmpA1._id],
        status: "TODO",
        dueDate: new Date(Date.now() + 86400000 * 5),
      },
      { id: adminUserA._id, companyId: companyA._id, role: "ADMIN" }
    );
    await updateTaskProgressService(taskG1._id, { progress: 100 }, { id: adminUserA._id, companyId: companyA._id, role: "ADMIN" });

    // Create tasks for Project 2 (Overdue & low progress)
    const taskR1 = await createTaskService(
      {
        projectId: projA2._id,
        title: "Overdue Task 1",
        assignedTo: [regularEmpA1._id],
        status: "IN_PROGRESS",
        progress: 20,
        dueDate: new Date(Date.now() - 86400000 * 3), // Past due date!
      },
      { id: adminUserA._id, companyId: companyA._id, role: "ADMIN" }
    );

    // 2. Test Analytics Computation
    console.log("\n--- Testing Analytics Engine ---");
    const analyticsRes = await getProjectAnalyticsService({ id: adminUserA._id, companyId: companyA._id, role: "ADMIN" });

    assert(analyticsRes.summary.totalProjects === 2, "Calculated total projects = 2");
    assert(analyticsRes.summary.totalTasks === 2, "Calculated total tasks = 2");
    assert(analyticsRes.summary.completedTasksCount === 1, "Calculated completed tasks = 1");
    assert(analyticsRes.summary.overdueTasksCount === 1, "Calculated overdue tasks count = 1");
    assert(analyticsRes.summary.completionRate === 50, "Calculated overall completion rate = 50%");

    // 3. Test Project Health Indicators (🟢/🟡/🔴)
    console.log("\n--- Testing Project Health Calculation ---");
    const healthGreen = analyticsRes.projectHealth.find((p) => p._id.toString() === projA1._id.toString());
    const healthRed = analyticsRes.projectHealth.find((p) => p._id.toString() === projA2._id.toString());

    assert(healthGreen && healthGreen.health === "GREEN", "Project 1 evaluated as 🟢 GREEN (On Track)");
    assert(healthRed && healthRed.health === "RED", "Project 2 evaluated as 🔴 RED (Past Deadline / Overdue)");

    // 4. Test In-Memory Analytics Caching
    console.log("\n--- Testing Analytics Caching ---");
    const secondCall = await getProjectAnalyticsService({ id: adminUserA._id, companyId: companyA._id, role: "ADMIN" });
    assert(secondCall.cached === true, "Repeated analytics call returned cached response");

    // 5. Test Analytics Multi-Tenant Isolation
    console.log("\n--- Testing Analytics Multi-Tenant Isolation ---");
    const analyticsCompB = await getProjectAnalyticsService({ id: adminUserB._id, companyId: companyB._id, role: "ADMIN" });
    assert(analyticsCompB.summary.totalProjects === 0, "Company B analytics strictly isolated (0 projects)");
    assert(analyticsCompB.summary.totalTasks === 0, "Company B analytics strictly isolated (0 tasks)");

    // Cleanup test data
    console.log("\n--- Cleaning up Test Data ---");
    await TaskUpdate.deleteMany({ companyId: { $in: [companyA._id, companyB._id] } });
    await Task.deleteMany({ companyId: { $in: [companyA._id, companyB._id] } });
    await Project.deleteMany({ companyId: { $in: [companyA._id, companyB._id] } });
    await Employee.deleteMany({ companyId: { $in: [companyA._id, companyB._id] } });
    await User.deleteMany({ companyId: { $in: [companyA._id, companyB._id] } });
    await Company.deleteMany({ _id: { $in: [companyA._id, companyB._id] } });
    console.log("✅ Test data cleaned up.");
  } catch (err) {
    console.error("❌ Unexpected test execution error:", err);
    failCount++;
  } finally {
    await mongoose.disconnect();
  }

  console.log(`\n=== TEST SUMMARY: ${passCount} PASSED, ${failCount} FAILED ===`);
  if (failCount > 0) {
    process.exit(1);
  }
};

runTests();
