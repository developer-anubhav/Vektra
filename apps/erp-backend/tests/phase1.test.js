import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import Company from "../src/models/Company.js";
import User from "../src/models/userModel.js";
import Employee from "../src/models/Employee.js";
import Project from "../src/models/Project.js";
import Milestone from "../src/models/Milestone.js";
import Task from "../src/models/Task.js";
import TaskUpdate from "../src/models/TaskUpdate.js";
import {
  createProjectService,
  getProjectsService,
  getProjectByIdService,
  updateProjectService,
  deleteProjectService,
} from "../src/services/projectService.js";

const runTests = async () => {
  console.log("=== RUNNING PHASE 1 VERIFICATION TESTS ===");
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
    // 1. Verify Model Indexes
    console.log("\n--- Testing Model Indexes ---");
    const projectIndexes = Project.schema.indexes();
    const milestoneIndexes = Milestone.schema.indexes();
    const taskIndexes = Task.schema.indexes();
    const taskUpdateIndexes = TaskUpdate.schema.indexes();

    const hasProjectIndex1 = projectIndexes.some(([idx]) => idx.companyId === 1 && idx.status === 1);
    const hasProjectIndex2 = projectIndexes.some(([idx]) => idx.companyId === 1 && idx.projectManager === 1);
    assert(hasProjectIndex1, "Project index { companyId: 1, status: 1 } exists");
    assert(hasProjectIndex2, "Project index { companyId: 1, projectManager: 1 } exists");

    const hasMilestoneIndex = milestoneIndexes.some(([idx]) => idx.companyId === 1 && idx.projectId === 1);
    assert(hasMilestoneIndex, "Milestone index { companyId: 1, projectId: 1 } exists");

    const hasTaskIndex1 = taskIndexes.some(([idx]) => idx.companyId === 1 && idx.projectId === 1);
    const hasTaskIndex2 = taskIndexes.some(([idx]) => idx.companyId === 1 && idx.assignedTo === 1 && idx.status === 1);
    const hasTaskIndex3 = taskIndexes.some(([idx]) => idx.companyId === 1 && idx.dueDate === 1);
    assert(hasTaskIndex1, "Task index { companyId: 1, projectId: 1 } exists");
    assert(hasTaskIndex2, "Task index { companyId: 1, assignedTo: 1, status: 1 } exists");
    assert(hasTaskIndex3, "Task index { companyId: 1, dueDate: 1 } exists");

    const hasTaskUpdateIndex = taskUpdateIndexes.some(([idx]) => idx.companyId === 1 && idx.taskId === 1 && idx.createdAt === -1);
    assert(hasTaskUpdateIndex, "TaskUpdate index { companyId: 1, taskId: 1, createdAt: -1 } exists");

    // 2. Setup Test Data (Company A & Company B)
    console.log("\n--- Setting up Test Data ---");
    const companyA = await Company.create({ name: "Phase1 Test Company A", email: "compA@test.com", adminName: "Admin A", status: "Active" });
    const companyB = await Company.create({ name: "Phase1 Test Company B", email: "compB@test.com", adminName: "Admin B", status: "Active" });

    const adminUserA = await User.create({ name: "Admin A", email: "adminA@test.com", password: "hash", role: "ADMIN", companyId: companyA._id });
    const managerEmpA1 = await Employee.create({ companyId: companyA._id, employeeId: "EMP-A1", name: "Manager A1", email: "managerA1@test.com", department: "Eng", role: "MANAGER" });
    const managerEmpA2 = await Employee.create({ companyId: companyA._id, employeeId: "EMP-A2", name: "Manager A2", email: "managerA2@test.com", department: "Eng", role: "MANAGER" });
    const regularEmpA = await Employee.create({ companyId: companyA._id, employeeId: "EMP-A3", name: "Employee A3", email: "employeeA3@test.com", department: "Eng", role: "EMPLOYEE" });

    const adminUserB = await User.create({ name: "Admin B", email: "adminB@test.com", password: "hash", role: "ADMIN", companyId: companyB._id });
    const managerEmpB = await Employee.create({ companyId: companyB._id, employeeId: "EMP-B1", name: "Manager B1", email: "managerB1@test.com", department: "Eng", role: "MANAGER" });

    // 3. Test Manager Role Eligibility Requirement
    console.log("\n--- Testing Manager Eligibility Validation ---");
    try {
      await createProjectService(
        { projectCode: "PRJ-FAIL", name: "Invalid PM Project", projectManager: regularEmpA._id },
        { id: adminUserA._id, companyId: companyA._id, role: "ADMIN" }
      );
      assert(false, "Project creation with EMPLOYEE as manager should fail");
    } catch (err) {
      assert(err.message.includes("eligible as a project manager"), "Blocked non-manager from being assigned as project manager");
    }

    // 4. Test Valid Project Creation
    console.log("\n--- Testing Valid Project Creation ---");
    const projA1 = await createProjectService(
      {
        projectCode: "PRJ-A1",
        name: "Company A Core Project",
        description: "Testing phase 1 project creation",
        priority: "HIGH",
        projectManager: managerEmpA1._id,
        teamMembers: [regularEmpA._id],
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000 * 30),
      },
      { id: adminUserA._id, companyId: companyA._id, role: "ADMIN" }
    );
    assert(projA1 && projA1.projectCode === "PRJ-A1", "Created project PRJ-A1 successfully for Company A");

    // 5. Test Tenant Isolation
    console.log("\n--- Testing Tenant Isolation ---");
    const projectsForCompB = await getProjectsService({ id: adminUserB._id, companyId: companyB._id, role: "ADMIN" });
    assert(projectsForCompB.length === 0, "Company B cannot list Company A's projects");

    try {
      await getProjectByIdService(projA1._id, { id: adminUserB._id, companyId: companyB._id, role: "ADMIN" });
      assert(false, "Company B fetch of Company A project should throw project not found");
    } catch (err) {
      assert(err.message.includes("Project not found"), "Company B blocked from fetching Company A project by ID");
    }

    // 6. Test Manager Scoping in Company A
    console.log("\n--- Testing Manager Scoping ---");
    const projectsManagerA1 = await getProjectsService({ id: adminUserA._id, email: managerEmpA1.email, companyId: companyA._id, role: "MANAGER" });
    const projectsManagerA2 = await getProjectsService({ id: adminUserA._id, email: managerEmpA2.email, companyId: companyA._id, role: "MANAGER" });
    assert(projectsManagerA1.length === 1, "Manager A1 sees their assigned project PRJ-A1");
    assert(projectsManagerA2.length === 0, "Manager A2 cannot see unassigned project PRJ-A1");

    // 7. Test Update & Archive/Delete Project
    console.log("\n--- Testing Project Update & Archive ---");
    const updatedProjA1 = await updateProjectService(
      projA1._id,
      { name: "Updated Company A Core Project", status: "IN_PROGRESS" },
      { id: adminUserA._id, companyId: companyA._id, role: "ADMIN" }
    );
    assert(updatedProjA1.name === "Updated Company A Core Project" && updatedProjA1.status === "IN_PROGRESS", "Successfully updated project details");

    const deleteRes = await deleteProjectService(projA1._id, { id: adminUserA._id, companyId: companyA._id, role: "ADMIN" });
    assert(deleteRes.project.status === "ARCHIVED", "Successfully archived project");

    // Cleanup test data
    console.log("\n--- Cleaning up Test Data ---");
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
