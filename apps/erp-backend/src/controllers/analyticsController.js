import { getProjectAnalyticsService } from "../services/analyticsService.js";

export const getProjectAnalytics = async (req, res) => {
  try {
    const analytics = await getProjectAnalyticsService(req.user);
    return res.status(200).json({ success: true, data: analytics });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
