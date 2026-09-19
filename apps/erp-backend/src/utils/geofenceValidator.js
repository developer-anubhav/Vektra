/**
 * Geofence Validator Utility
 * ===========================
 * Calculates the distance between two GPS coordinates using the Haversine formula
 * and validates whether a device is within an allowed work location radius.
 */

const EARTH_RADIUS_METERS = 6371000; // Earth's mean radius in meters

/**
 * Convert degrees to radians
 */
const toRadians = (degrees) => (degrees * Math.PI) / 180;

/**
 * Calculates distance in meters between two GPS coordinate points (lat1, lon1) and (lat2, lon2).
 *
 * @param {number} lat1 Latitude of point 1
 * @param {number} lon1 Longitude of point 1
 * @param {number} lat2 Latitude of point 2
 * @param {number} lon2 Longitude of point 2
 * @returns {number} Distance in meters (rounded to 1 decimal place)
 */
export const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
  if (
    lat1 === undefined || lon1 === undefined ||
    lat2 === undefined || lon2 === undefined ||
    isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)
  ) {
    return Infinity;
  }

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const radLat1 = toRadians(lat1);
  const radLat2 = toRadians(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(radLat1) * Math.cos(radLat2) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distanceMeters = EARTH_RADIUS_METERS * c;
  return Math.round(distanceMeters * 10) / 10;
};

/**
 * Validates whether user GPS coordinates fall within company work location geofence.
 *
 * @param {object} userCoords { latitude, longitude, accuracy }
 * @param {object} workLocation { latitude, longitude, radiusMeters, enabled, name }
 * @returns {object} { insideGeofence, distanceMeters, allowedRadiusMeters, message }
 */
export const validateGeofence = (userCoords = {}, workLocation = {}) => {
  // If geofence is disabled by admin, pass automatically
  if (workLocation.enabled === false) {
    return {
      insideGeofence: true,
      distanceMeters: 0,
      allowedRadiusMeters: workLocation.radiusMeters || 200,
      geofenceStatus: "NOT_REQUIRED",
      message: "Geofencing is disabled for this organization",
    };
  }

  const userLat = Number(userCoords.latitude);
  const userLon = Number(userCoords.longitude);
  const targetLat = Number(workLocation.latitude);
  const targetLon = Number(workLocation.longitude);
  const allowedRadius = Number(workLocation.radiusMeters) || 200;

  if (isNaN(userLat) || isNaN(userLon)) {
    return {
      insideGeofence: false,
      distanceMeters: null,
      allowedRadiusMeters: allowedRadius,
      geofenceStatus: "FAILED",
      message: "GPS coordinates are missing or invalid",
    };
  }

  const distanceMeters = calculateHaversineDistance(userLat, userLon, targetLat, targetLon);
  const insideGeofence = distanceMeters <= allowedRadius;

  const locationName = workLocation.name || "Approved Work Location";

  if (insideGeofence) {
    return {
      insideGeofence: true,
      distanceMeters,
      allowedRadiusMeters: allowedRadius,
      geofenceStatus: "PASSED",
      message: `Verified inside ${locationName} (${distanceMeters}m from target, max ${allowedRadius}m)`,
    };
  } else {
    return {
      insideGeofence: false,
      distanceMeters,
      allowedRadiusMeters: allowedRadius,
      geofenceStatus: "FAILED",
      message: `Outside ${locationName}! Distance: ${distanceMeters}m exceeds max radius of ${allowedRadius}m`,
    };
  }
};
