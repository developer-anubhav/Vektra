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
import { createProjectService } from "../src/services/projectService.js";
import { createMilestoneService } from "../src/services/milestoneService.js";
import {
  createTaskService,
  getTasksService,
  getMyTasksService,
  getTaskByIdService,
  updateTaskService,
  deleteTaskService,
  updateTaskProgressService,
  addTaskUpdateService,
  getTaskUpdatesService,
} from "../src/services/taskService.js";

const runTests = async () => {
  console.log("=== RUNNING PHASE 3 VERIFICATION TESTS ===");
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
    // 1. Setup Test Data (Company A & Company B)
    console.log("\n--- Setting up Test Data ---");
    const companyA = await Company.create({ name: "Phase3 Test Company A", email: "compA_p3@test.com", adminName: "Admin A", status: "Active" });
    const companyB = await Company.create({ name: "Phase3 Test Company B", email: "compB_p3@test.com", adminName: "Admin B", status: "Active" });

    const adminUserA = await User.create({ name: "Admin A", email: "adminA_p3@test.com", password: "hash", role: "ADMIN", companyId: companyA._id });
    const managerEmpA = await Employee.create({ companyId: companyA._id, employeeId: "EMP-A-M1", name: "Manager A1", email: "managerA1_p3@test.com", department: "Eng", role: "MANAGER" });
    const regularEmpA1 = await Employee.create({ companyId: companyA._id, employeeId: "EMP-A-E1", name: "Employee A1", email: "employeeA1_p3@test.com", department: "Eng", role: "EMPLOYEE" });
    const regularEmpA2 = await Employee.create({ companyId: companyA._id, employeeId: "EMP-A-E2", name: "Employee A2", email: "employeeA2_p3@test.com", department: "Eng", role: "EMPLOYEE" });

    const adminUserB = await User.create({ name: "Admin B", email: "adminB_p3@test.com", password: "hash", role: "ADMIN", companyId: companyB._id });

    const projA = await createProjectService(
      {
        projectCode: "PRJ-P3-A",
        name: "Phase 3 Core Project",
        priority: "HIGH",
        projectManager: managerEmpA._id,
        teamMembers: [regularEmpA1._id, regularEmpA2._id],
      },
      { id: adminUserA._id, companyId: companyA._id, role: "ADMIN" }
    );

    const milestoneA = await createMilestoneService(
      projA._id,
      { title: "M1 Database Models", dueDate: new Date(Date.now() + 86400000 * 7) },
      { id: adminUserA._id, companyId: companyA._id, role: "ADMIN" }
    );

    // 2. Test Task Creation
    console.log("\n--- Testing Task Creation & Assignment ---");
    const task1 = await createTaskService(
      {
        projectId: projA._id,
        milestoneId: milestoneA._id,
        title: "Implement Task Schema & Service",
        description: "Create Task model with compound indexes",
        assignedTo: [regularEmpA1._id],
        priority: "URGENT",
        status: "TODO",
        dueDate: new Date(Date.now() + 86400000 * 3),
      },
      { id: adminUserA._id, companyId: companyA._id, role: "ADMIN" }
    );
    assert(task1 && task1.title === "Implement Task Schema & Service", "Created task1 under project and milestone");
    assert(task1.assignedTo.length === 1 && task1.assignedTo[0]._id.toString() === regularEmpA1._id.toString(), "Assigned task1 to employee A1");

    // 3. Test My Tasks Endpoint
    console.log("\n--- Testing My Tasks Endpoint ---");
    const myTasksEmpA1 = await getMyTasksService({ id: adminUserA._id, email: regularEmpA1.email, companyId: companyA._id, role: "EMPLOYEE" });
    const myTasksEmpA2 = await getMyTasksService({ id: adminUserA._id, email: regularEmpA2.email, companyId: companyA._id, role: "EMPLOYEE" });
    assert(myTasksEmpA1.length === 1 && myTasksEmpA1[0]._id.toString() === task1._id.toString(), "Employee A1 retrieves their assigned task");
    assert(myTasksEmpA2.length === 0, "Employee A2 has 0 assigned tasks");

    // 4. Test Progress Tracking & TaskUpdate Audit History
    console.log("\n--- Testing Progress Tracking & TaskUpdate Audit Trail ---");
    const progressRes = await updateTaskProgressService(
      task1._id,
      { progress: 50, updateMessage: "Completed base schemas and service methods" },
      { id: adminUserA._id, email: regularEmpA1.email, companyId: companyA._id, role: "EMPLOYEE" }
    );

    assert(progressRes.task.progress === 50 && progressRes.task.status === "TODO", "Updated task progress to 50%");
    assert(progressRes.update.progressBefore === 0 && progressRes.update.progressAfter === 50, "TaskUpdate captured progressBefore (0) and progressAfter (50)");

    // Add explicit update note
    const updateNote = await addTaskUpdateService(
      task1._id,
      { updateMessage: "Reviewing code before marking completed", progress: 80 },
      { id: adminUserA._id, email: regularEmpA1.email, companyId: companyA._id, role: "EMPLOYEE" }
    );
    assert(updateNote.progressBefore === 50 && updateNote.progressAfter === 80, "Added task update note recording progress shift 50 -> 80");

    // Set progress to 100% -> Auto complete
    const finalProgressRes = await updateTaskProgressService(
      task1._id,
      { progress: 100, updateMessage: "Finished implementation and testing" },
      { id: adminUserA._id, email: regularEmpA1.email, companyId: companyA._id, role: "EMPLOYEE" }
    );
    assert(finalProgressRes.task.status === "COMPLETED" && finalProgressRes.task.completedAt !== null, "Progress 100% automatically set status to COMPLETED with completedAt timestamp");

    // Fetch Task History
    const updatesHistory = await getTaskUpdatesService(task1._id, { id: adminUserA._id, companyId: companyA._id, role: "ADMIN" });
    assert(updatesHistory.length === 3, "Fetched complete TaskUpdate history containing 3 audit entries");

    // 5. Test Multi-Tenant Isolation for Tasks & Updates
    console.log("\n--- Testing Task Multi-Tenant Isolation ---");
    try {
      await getTaskByIdService(task1._id, { id: adminUserB._id, companyId: companyB._id, role: "ADMIN" });
      assert(false, "Company B fetch of Company A task should fail");
    } catch (err) {
      assert(err.message.includes("Task not found"), "Company B blocked from fetching Company A task by ID");
    }

    try {
      await updateTaskProgressService(task1._id, { progress: 0 }, { id: adminUserB._id, companyId: companyB._id, role: "ADMIN" });
      assert(false, "Company B progress update on Company A task should fail");
    } catch (err) {
      assert(err.message.includes("Task not found"), "Company B blocked from updating Company A task progress");
    }

    // 6. Test Task Deletion & Audit Trail Cleanup
    console.log("\n--- Testing Task Deletion ---");
    const deleteRes = await deleteTaskService(task1._id, { id: adminUserA._id, companyId: companyA._id, role: "ADMIN" });
    assert(deleteRes.message.includes("deleted successfully"), "Successfully deleted task");

    const remainingUpdates = await TaskUpdate.find({ companyId: companyA._id, taskId: task1._id });
    assert(remainingUpdates.length === 0, "Task deletion cleaned up associated TaskUpdate audit history");

    // Cleanup test data
    console.log("\n--- Cleaning up Test Data ---");
    await TaskUpdate.deleteMany({ companyId: { $in: [companyA._id, companyB._id] } });
    await Task.deleteMany({ companyId: { $in: [companyA._id, companyB._id] } });
    await Milestone.deleteMany({ companyId: { $in: [companyA._id, companyB._id] } });
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
