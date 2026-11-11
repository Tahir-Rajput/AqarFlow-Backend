
import Property from "../models/property.js";
import Lead from "../models/lead.js";
import Visit from "../models/visit.js";
import Deal from "../models/deal.js";

export const getDashboardStats = async (req, res) => {
  try {
    const agencyId = req.user.agencyId;
    const isAdmin = req.user.role === "admin";

    const propertyFilter = {
      agencyId,
      isPublished: true,
      status: "available",
    };

    const leadFilter = {
      agencyId,
      status: "New",
    };

    const visitFilter = {
      agencyId,
      status: { $in: ["Requested", "Confirmed"] },
      scheduledAt: { $gte: new Date() },
    };

    const dealFilter = {
      agencyId,
      stage: { $nin: ["Closed Won", "Closed Lost"] },
    };

    if (!isAdmin) {
      propertyFilter.assignedAgent = req.user._id;
      leadFilter.assignedAgent = req.user._id;
      visitFilter.agent = req.user._id;
      dealFilter.agent = req.user._id;
    }

    const [
      totalProperties,
      newLeads,
      upcomingVisits,
      openDeals,
    ] = await Promise.all([
      Property.countDocuments(propertyFilter),
      Lead.countDocuments(leadFilter),
      Visit.countDocuments(visitFilter),
      Deal.countDocuments(dealFilter),
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        totalProperties,
        newLeads,
        upcomingVisits,
        openDeals,
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard statistics.",
    });
  }
};
