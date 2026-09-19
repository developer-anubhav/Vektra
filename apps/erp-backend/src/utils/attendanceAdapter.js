import Attendance from "../models/Attendance.js";

/**
 * Adapter function to query the standalone Attendance collection.
 * Replaces direct reads of embedded company.attendance[].
 */
export const getAttendanceRecords = async (companyId, filter = {}, options = {}) => {
  if (!companyId) return [];

  const query = { companyId, ...filter };
  let q = Attendance.find(query);

  if (options.sort) {
    q = q.sort(options.sort);
  }
  if (options.limit) {
    q = q.limit(options.limit);
  }

  return await q.exec();
};

export const getAttendanceById = async (companyId, attendanceId) => {
  if (!companyId || !attendanceId) return null;
  return await Attendance.findOne({ _id: attendanceId, companyId });
};
