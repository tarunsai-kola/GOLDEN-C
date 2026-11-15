const mongoose = require('mongoose');
const SavedItem = require('../models/savedItem.model');
const SavedCompany = require('../models/savedCompany.model');
const SavedJob = require('../models/savedJob.model');
const Organization = require('../models/organization.model');
const { Event } = require('../models/event.model');
const { Job } = require('../models/job.model');
const ApiError = require('../utils/apiError');

class SavedItemService {
  /**
   * Bookmark / save an item (company, event, job, product)
   */
  async saveItem(userId, itemType, itemId) {
    if (!['company', 'event', 'job', 'product'].includes(itemType)) {
      throw ApiError.badRequest('Invalid item type');
    }

    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      throw ApiError.badRequest('Invalid item ID');
    }

    if (itemType === 'company') {
      const org = await Organization.findById(itemId);
      if (!org) throw ApiError.notFound('Company not found');
      await SavedCompany.findOneAndUpdate(
        { userId, organizationId: itemId },
        { userId, organizationId: itemId, createdAt: new Date() },
        { upsert: true }
      );
    } else if (itemType === 'event') {
      const event = await Event.findById(itemId);
      if (!event) throw ApiError.notFound('Event not found');
    } else if (itemType === 'job') {
      const job = await Job.findById(itemId);
      if (!job) throw ApiError.notFound('Job opening not found');
      await SavedJob.findOneAndUpdate(
        { userId, jobId: itemId },
        { userId, jobId: itemId, createdAt: new Date() },
        { upsert: true }
      );
    }

    await SavedItem.findOneAndUpdate(
      { userId, itemType, itemId },
      { userId, itemType, itemId, createdAt: new Date() },
      { upsert: true, new: true }
    );

    return { isSaved: true, message: `Successfully saved ${itemType}` };
  }

  /**
   * Remove item from saved bookmarks
   */
  async unsaveItem(userId, itemType, itemId) {
    if (!['company', 'event', 'job', 'product'].includes(itemType)) {
      throw ApiError.badRequest('Invalid item type');
    }

    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      throw ApiError.badRequest('Invalid item ID');
    }

    await SavedItem.findOneAndDelete({ userId, itemType, itemId });

    if (itemType === 'company') {
      await SavedCompany.findOneAndDelete({ userId, organizationId: itemId });
    } else if (itemType === 'job') {
      await SavedJob.findOneAndDelete({ userId, jobId: itemId });
    }

    return { isSaved: false, message: `Successfully removed ${itemType} from saved` };
  }

  /**
   * Retrieve saved items with polymorphic population
   */
  async getSavedItems(userId, query = {}) {
    const filter = { userId };
    const type = query.type || query.itemType;
    if (type) {
      filter.itemType = type;
    }

    const saved = await SavedItem.find(filter).sort({ createdAt: -1 }).lean();

    const populated = await Promise.all(
      saved.map(async (s) => {
        let details = null;
        if (s.itemType === 'company') {
          details = await Organization.findById(s.itemId)
            .select('name slug logo location website isVerified')
            .lean();
        } else if (s.itemType === 'event') {
          details = await Event.findById(s.itemId)
            .select('title slug date startTime category format coverImage pricingType price')
            .populate('organizationId', 'name slug logo')
            .lean();
        } else if (s.itemType === 'job') {
          details = await Job.findById(s.itemId)
            .select('title slug employmentType workplaceType location salary expiryDate')
            .populate('organizationId', 'name slug logo')
            .lean();
        }
        return {
          _id: s._id,
          itemType: s.itemType,
          itemId: s.itemId,
          item: details,
          savedAt: s.createdAt,
        };
      })
    );

    // Filter out deleted items
    const validItems = populated.filter((entry) => entry.item !== null);

    // Counts by category
    const [companyCount, eventCount, jobCount] = await Promise.all([
      SavedItem.countDocuments({ userId, itemType: 'company' }),
      SavedItem.countDocuments({ userId, itemType: 'event' }),
      SavedItem.countDocuments({ userId, itemType: 'job' }),
    ]);

    return {
      items: validItems,
      counts: {
        all: validItems.length,
        company: companyCount,
        event: eventCount,
        job: jobCount,
      },
    };
  }

  /**
   * Check if item is saved
   */
  async isSaved(userId, itemType, itemId) {
    if (!userId) return { isSaved: false };
    const exists = await SavedItem.exists({ userId, itemType, itemId });
    return { isSaved: !!exists };
  }
}

module.exports = new SavedItemService();
