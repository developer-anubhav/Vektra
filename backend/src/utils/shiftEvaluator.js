/**
 * Shift Evaluator Utility
 * ========================
 * Evaluates employee check-in and check-out times against company shift settings.
 *
 * Rules:
 *   1. Check-In Evaluation:
 *      - Shift Start: e.g. "09:00"
 *      - Grace Period: e.g. 15 mins (up to 09:15)
 *      - If Check-In <= Shift Start + Grace -> Status: "Present", Remarks: "On Time"
 *      - If Check-In > Shift Start + Grace  -> Status: "Late", Remarks: "Late Arrival by X mins"
 *
 *   2. Check-Out & Duration Evaluation:
 *      - Work Duration = (checkOutTime - checkInTime) in minutes
 *      - If Work Duration < 240 mins (4 hrs) -> Status: "Half Day"
 *      - Shift End: e.g. "17:00" - Grace 15 mins (before 16:45) -> Remarks: "... (Early Check-Out by Y mins)"
 */

export function evaluateShiftAttendance(checkInTime, checkOutTime, shiftSettings = {}) {
  const startTimeStr = shiftSettings.startTime || "09:00";
  const endTimeStr = shiftSettings.endTime || "17:00";
  const graceMinutes = Number(shiftSettings.gracePeriodMinutes ?? 15);

  let status = "Present";
  let remarks = "On Time";
  let workDurationMinutes = null;

  if (!checkInTime) {
    return { status: "Absent", remarks: "No Check-In Recorded", workDurationMinutes: 0 };
  }

  const checkInDate = new Date(checkInTime);

  // Parse Shift Start Time on check-in date
  const [startHours, startMins] = startTimeStr.split(":").map(Number);
  const shiftStart = new Date(checkInDate);
  shiftStart.setHours(startHours, startMins, 0, 0);

  const graceStartLimit = new Date(shiftStart.getTime() + graceMinutes * 60 * 1000);

  // Check-In evaluation
  if (checkInDate > graceStartLimit) {
    status = "Late";
    const diffMins = Math.round((checkInDate - shiftStart) / 60000);
    remarks = `Late Arrival by ${diffMins} mins`;
  } else {
    status = "Present";
    remarks = "On Time";
  }

  // Check-Out & Work Duration evaluation
  if (checkOutTime) {
    const checkOutDate = new Date(checkOutTime);
    workDurationMinutes = Math.max(0, Math.round((checkOutDate - checkInDate) / 60000));

    // Check if Half Day (less than 4 hours = 240 mins)
    if (workDurationMinutes < 240) {
      status = "Half Day";
      remarks += " (Half Day - Under 4 hrs)";
    } else {
      // Check Early Departure
      const [endHours, endMins] = endTimeStr.split(":").map(Number);
      const shiftEnd = new Date(checkOutDate);
      shiftEnd.setHours(endHours, endMins, 0, 0);

      const graceEndLimit = new Date(shiftEnd.getTime() - graceMinutes * 60 * 1000);
      if (checkOutDate < graceEndLimit) {
        const earlyMins = Math.round((shiftEnd - checkOutDate) / 60000);
        remarks += ` (Early Check-Out by ${earlyMins} mins)`;
      }
    }
  }

  return {
    status,
    remarks,
    workDurationMinutes,
  };
}
