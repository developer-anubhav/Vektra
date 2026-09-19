import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import Company from "../src/models/Company.js";
import User from "../src/models/userModel.js";
import Employee from "../src/models/Employee.js";
import Project from "../src/models/Project.js";
import Task from "../src/models/Task.js";
import Notification from "../src/models/Notification.js";
import TaskUpdate from "../src/models/TaskUpdate.js";
import { createProjectService } from "../src/services/projectService.js";
import { createTaskService, updateTaskProgressService } from "../src/services/taskService.js";
import {
  getUserNotificationsService,
  markNotificationAsReadService,
  markAllNotificationsAsReadService,
  getActivityLogsService,
} from "../src/services/notificationService.js";

const runTests = async () => {
  console.log("=== RUNNING PHASE 5 VERIFICATION TESTS ===");
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
    const companyA = await Company.create({ name: "Phase5 Test Company A", email: "compA_p5@test.com", adminName: "Admin A", status: "Active" });
    const companyB = await Company.create({ name: "Phase5 Test Company B", email: "compB_p5@test.com", adminName: "Admin B", status: "Active" });

    const adminUserA = await User.create({ name: "Admin A", email: "adminA_p5@test.com", password: "hash", role: "ADMIN", companyId: companyA._id });
    const empUserA = await User.create({ name: "Employee A1 User", email: "employeeA1_p5@test.com", password: "hash", role: "EMPLOYEE", companyId: companyA._id });
    const managerEmpA = await Employee.create({ companyId: companyA._id, employeeId: "EMP-A-M1", name: "Manager A1", email: "managerA1_p5@test.com", department: "Eng", role: "MANAGER" });
    const regularEmpA1 = await Employee.create({ _id: empUserA._id, companyId: companyA._id, employeeId: "EMP-A-E1", name: "Employee A1", email: "employeeA1_p5@test.com", department: "Eng", role: "EMPLOYEE" });

    const adminUserB = await User.create({ name: "Admin B", email: "adminB_p5@test.com", password: "hash", role: "ADMIN", companyId: companyB._id });

    const projA = await createProjectService(
      {
        projectCode: "PRJ-P5-A",
        name: "Phase 5 Core Project",
        priority: "HIGH",
        projectManager: managerEmpA._id,
        teamMembers: [regularEmpA1._id],
      },
      { id: adminUserA._id, companyId: companyA._id, role: "ADMIN" }
    );

    // 2. Test Automatic Notification on Task Assignment
    console.log("\n--- Testing Task Assignment Notification ---");
    const task1 = await createTaskService(
      {
        projectId: projA._id,
        title: "Implement In-App Notifications",
        assignedTo: [regularEmpA1._id],
        status: "TODO",
        dueDate: new Date(Date.now() + 86400000 * 3),
      },
      { id: adminUserA._id, companyId: companyA._id, role: "ADMIN" }
    );

    const empNotifs = await getUserNotificationsService({ id: empUserA._id, companyId: companyA._id, role: "EMPLOYEE" });
    assert(empNotifs.notifications.length === 1, "Employee A1 received 1 notification for task assignment");
    assert(empNotifs.notifications[0].type === "TASK_ASSIGNED", "Notification type is TASK_ASSIGNED");
    assert(empNotifs.unreadCount === 1, "Unread count is 1");

    // 3. Test Task Progress Update Notification to Task Creator (assignedBy)
    console.log("\n--- Testing Task Progress Update Notification ---");
    await updateTaskProgressService(
      task1._id,
      { progress: 75, updateMessage: "Notifications backend implemented" },
      { id: empUserA._id, email: empUserA.email, companyId: companyA._id, role: "EMPLOYEE" }
    );

    const adminNotifs = await getUserNotificationsService({ id: adminUserA._id, companyId: companyA._id, role: "ADMIN" });
    assert(adminNotifs.notifications.length === 1, "Admin (Task Creator) received 1 notification for progress update");
    assert(adminNotifs.notifications[0].type === "TASK_UPDATED", "Notification type is TASK_UPDATED");

    // 4. Test Notification Read Status Mutations
    console.log("\n--- Testing Read Status Mutations ---");
    const notifId = empNotifs.notifications[0]._id;
    const readNotif = await markNotificationAsReadService(notifId, { id: empUserA._id, companyId: companyA._id, role: "EMPLOYEE" });
    assert(readNotif.isRead === true, "Marked single notification as read");

    await markAllNotificationsAsReadService({ id: adminUserA._id, companyId: companyA._id, role: "ADMIN" });
    const adminNotifsAfter = await getUserNotificationsService({ id: adminUserA._id, companyId: companyA._id, role: "ADMIN" });
    assert(adminNotifsAfter.unreadCount === 0, "Marked all admin notifications as read (unreadCount = 0)");

    // 5. Test Activity Log Surfacing
    console.log("\n--- Testing Activity Logs Surfacing ---");
    const activityLogs = await getActivityLogsService({ id: adminUserA._id, companyId: companyA._id, role: "ADMIN" });
    assert(activityLogs.length === 1, "Fetched activity logs from TaskUpdate trail");
    assert(activityLogs[0].updateMessage.includes("Notifications backend implemented"), "Activity log contains update message");

    // 6. Test Multi-Tenant Isolation
    console.log("\n--- Testing Multi-Tenant Isolation ---");
    const notifsB = await getUserNotificationsService({ id: adminUserB._id, companyId: companyB._id, role: "ADMIN" });
    assert(notifsB.notifications.length === 0, "Company B has 0 notifications (strictly isolated)");

    const logsB = await getActivityLogsService({ id: adminUserB._id, companyId: companyB._id, role: "ADMIN" });
    assert(logsB.length === 0, "Company B has 0 activity logs (strictly isolated)");

    // Cleanup test data
    console.log("\n--- Cleaning up Test Data ---");
    await Notification.deleteMany({ companyId: { $in: [companyA._id, companyB._id] } });
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
