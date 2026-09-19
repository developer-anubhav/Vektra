import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import Company from "../src/models/Company.js";
import User from "../src/models/userModel.js";
import Employee from "../src/models/Employee.js";
import Project from "../src/models/Project.js";
import Milestone from "../src/models/Milestone.js";
import {
  createProjectService,
  addTeamMembersService,
  removeTeamMemberService,
  getProjectMembersService,
} from "../src/services/projectService.js";
import {
  createMilestoneService,
  getMilestonesService,
  updateMilestoneService,
  deleteMilestoneService,
} from "../src/services/milestoneService.js";

const runTests = async () => {
  console.log("=== RUNNING PHASE 2 VERIFICATION TESTS ===");
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
    const companyA = await Company.create({ name: "Phase2 Test Company A", email: "compA_p2@test.com", adminName: "Admin A", status: "Active" });
    const companyB = await Company.create({ name: "Phase2 Test Company B", email: "compB_p2@test.com", adminName: "Admin B", status: "Active" });

    const adminUserA = await User.create({ name: "Admin A", email: "adminA_p2@test.com", password: "hash", role: "ADMIN", companyId: companyA._id });
    const managerEmpA = await Employee.create({ companyId: companyA._id, employeeId: "EMP-A-M1", name: "Manager A1", email: "managerA1_p2@test.com", department: "Eng", role: "MANAGER" });
    const regularEmpA1 = await Employee.create({ companyId: companyA._id, employeeId: "EMP-A-E1", name: "Employee A1", email: "employeeA1_p2@test.com", department: "Eng", role: "EMPLOYEE" });
    const regularEmpA2 = await Employee.create({ companyId: companyA._id, employeeId: "EMP-A-E2", name: "Employee A2", email: "employeeA2_p2@test.com", department: "Eng", role: "EMPLOYEE" });

    const adminUserB = await User.create({ name: "Admin B", email: "adminB_p2@test.com", password: "hash", role: "ADMIN", companyId: companyB._id });
    const regularEmpB = await Employee.create({ companyId: companyB._id, employeeId: "EMP-B-E1", name: "Employee B1", email: "employeeB1_p2@test.com", department: "Eng", role: "EMPLOYEE" });

    const projA = await createProjectService(
      {
        projectCode: "PRJ-P2-A",
        name: "Phase 2 Core Project",
        priority: "HIGH",
        projectManager: managerEmpA._id,
        teamMembers: [regularEmpA1._id],
      },
      { id: adminUserA._id, companyId: companyA._id, role: "ADMIN" }
    );
    assert(projA && projA.teamMembers.length === 1, "Created initial project with 1 team member");

    // 2. Test Cross-Tenant Team Member Assignment Rejection
    console.log("\n--- Testing Team Assignment Tenant Validation ---");
    try {
      await addTeamMembersService(projA._id, [regularEmpB._id], { id: adminUserA._id, companyId: companyA._id, role: "ADMIN" });
      assert(false, "Adding Company B employee to Company A project should fail");
    } catch (err) {
      assert(err.message.includes("do not belong to your company"), "Blocked cross-tenant employee assignment to project");
    }

    // 3. Test Valid Team Member Addition & Removal
    console.log("\n--- Testing Valid Team Member Management ---");
    const updatedProj = await addTeamMembersService(projA._id, [regularEmpA2._id], { id: adminUserA._id, companyId: companyA._id, role: "ADMIN" });
    assert(updatedProj.teamMembers.length === 2, "Successfully added valid employee to team members");

    const membersRes = await getProjectMembersService(projA._id, { id: adminUserA._id, companyId: companyA._id, role: "ADMIN" });
    assert(membersRes.teamMembers.length === 2, "Fetched project members correctly");

    const projAfterRemove = await removeTeamMemberService(projA._id, regularEmpA2._id, { id: adminUserA._id, companyId: companyA._id, role: "ADMIN" });
    assert(projAfterRemove.teamMembers.length === 1, "Successfully removed employee from team members");

    // 4. Test Milestone CRUD
    console.log("\n--- Testing Milestone CRUD ---");
    const milestone1 = await createMilestoneService(
      projA._id,
      {
        title: "Sprint 1 Architecture",
        description: "Complete design docs and base models",
        dueDate: new Date(Date.now() + 86400000 * 7),
        status: "IN_PROGRESS",
        progress: 30,
      },
      { id: adminUserA._id, companyId: companyA._id, role: "ADMIN" }
    );
    assert(milestone1 && milestone1.title === "Sprint 1 Architecture", "Created milestone 1 under project");

    const milestoneList = await getMilestonesService(projA._id, { id: adminUserA._id, companyId: companyA._id, role: "ADMIN" });
    assert(milestoneList.length === 1 && milestoneList[0]._id.toString() === milestone1._id.toString(), "Listed project milestones");

    const updatedMilestone = await updateMilestoneService(
      milestone1._id,
      { status: "COMPLETED", progress: 100 },
      { id: adminUserA._id, companyId: companyA._id, role: "ADMIN" }
    );
    assert(updatedMilestone.status === "COMPLETED" && updatedMilestone.progress === 100, "Updated milestone status and progress");

    // 5. Test Milestone Tenant Isolation
    console.log("\n--- Testing Milestone Tenant Isolation ---");
    try {
      await updateMilestoneService(milestone1._id, { title: "Hacked" }, { id: adminUserB._id, companyId: companyB._id, role: "ADMIN" });
      assert(false, "Company B update of Company A milestone should fail");
    } catch (err) {
      assert(err.message.includes("Milestone not found"), "Company B blocked from updating Company A milestone");
    }

    try {
      await deleteMilestoneService(milestone1._id, { id: adminUserB._id, companyId: companyB._id, role: "ADMIN" });
      assert(false, "Company B deletion of Company A milestone should fail");
    } catch (err) {
      assert(err.message.includes("Milestone not found"), "Company B blocked from deleting Company A milestone");
    }

    // Delete milestone legally
    const deleteRes = await deleteMilestoneService(milestone1._id, { id: adminUserA._id, companyId: companyA._id, role: "ADMIN" });
    assert(deleteRes.message.includes("deleted successfully"), "Successfully deleted milestone");

    // Cleanup test data
    console.log("\n--- Cleaning up Test Data ---");
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
