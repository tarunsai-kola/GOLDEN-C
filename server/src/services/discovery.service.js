const mongoose = require('mongoose');
const Organization = require('../models/organization.model');
const CompanyProfile = require('../models/companyProfile.model');
const OrganizationFollower = require('../models/organizationFollower.model');
const SavedCompany = require('../models/savedCompany.model');
const ApiError = require('../utils/apiError');

class DiscoveryService {
  /**
   * Advanced multi-faceted startup search & discovery
   */
  async getStartups(queryParams = {}, currentUserId = null) {
    const {
      q,
      industry,
      stage,
      location,
      foundedFrom,
      foundedTo,
      teamSize,
      isHiring,
      isVerified,
      sort = 'popularity',
      page = 1,
      limit = 12,
    } = queryParams;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    // Build Aggregation Pipeline
    const pipeline = [];

    // Stage 1: Active organizations
    pipeline.push({
      $match: { status: 'active' },
    });

    // Stage 2: Join CompanyProfile
    pipeline.push({
      $lookup: {
        from: 'companyprofiles',
        localField: '_id',
        foreignField: 'organizationId',
        as: 'profile',
      },
    });

    pipeline.push({
      $unwind: {
        path: '$profile',
        preserveNullAndEmptyArrays: true,
      },
    });

    // Stage 3: Filter published profiles only
    pipeline.push({
      $match: {
        'profile.isPublished': { $ne: false },
      },
    });

    // Stage 4: Multi-filter criteria
    const andConditions = [];

    // Keyword Search (q)
    if (q && q.trim()) {
      const searchRegex = new RegExp(q.trim(), 'i');
      andConditions.push({
        $or: [
          { name: searchRegex },
          { location: searchRegex },
          { 'profile.tagline': searchRegex },
          { 'profile.description': searchRegex },
          { 'profile.problemSolved': searchRegex },
          { 'profile.industry': searchRegex },
          { 'profile.products.name': searchRegex },
          { 'profile.products.description': searchRegex },
        ],
      });
    }

    // Industry Filter (supports comma-separated list e.g. "AI,Biotechnology")
    if (industry && industry.trim()) {
      const industryList = industry
        .split(',')
        .map((i) => i.trim())
        .filter(Boolean);
      andConditions.push({
        $or: industryList.map((ind) => ({
          'profile.industry': { $regex: new RegExp(`^${ind}$`, 'i') },
        })),
      });
    }

    // Stage Filter (e.g. "Seed,Series A")
    if (stage && stage.trim()) {
      const stageList = stage
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      andConditions.push({
        $or: stageList.map((stg) => ({
          'profile.companyStage': { $regex: new RegExp(`^${stg}$`, 'i') },
        })),
      });
    }

    // Location Filter
    if (location && location.trim()) {
      andConditions.push({
        location: { $regex: new RegExp(location.trim(), 'i') },
      });
    }

    // Founded Year Range
    if (foundedFrom || foundedTo) {
      const yearFilter = {};
      if (foundedFrom) {
        yearFilter.$gte = parseInt(foundedFrom, 10);
      }
      if (foundedTo) {
        yearFilter.$lte = parseInt(foundedTo, 10);
      }
      andConditions.push({ 'profile.foundedYear': yearFilter });
    }

    // Team Size Filter
    if (teamSize && teamSize.trim()) {
      const teamList = teamSize
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      andConditions.push({ 'profile.teamSize': { $in: teamList } });
    }

    // Hiring Toggle Filter
    if (isHiring === true || isHiring === 'true') {
      andConditions.push({ 'profile.isHiring': true });
    }

    if (andConditions.length > 0) {
      pipeline.push({ $match: { $and: andConditions } });
    }

    // Stage 5: Lookup Verification Record
    pipeline.push({
      $lookup: {
        from: 'verificationrecords',
        localField: '_id',
        foreignField: 'organizationId',
        as: 'verification',
      },
    });

    pipeline.push({
      $unwind: {
        path: '$verification',
        preserveNullAndEmptyArrays: true,
      },
    });

    // Filter by Verified if requested
    if (isVerified === true || isVerified === 'true') {
      pipeline.push({
        $match: { 'verification.status': 'verified' },
      });
    }

    // Stage 6: Lookup Followers Count
    pipeline.push({
      $lookup: {
        from: 'organizationfollowers',
        localField: '_id',
        foreignField: 'organizationId',
        as: 'followers',
      },
    });

    pipeline.push({
      $addFields: {
        followerCount: { $size: '$followers' },
        isVerified: { $eq: ['$verification.status', 'verified'] },
      },
    });

    // Stage 7: Sorting
    let sortStage = {};
    switch (sort) {
      case 'popularity':
        sortStage = { followerCount: -1, createdAt: -1 };
        break;
      case 'newest':
        sortStage = { createdAt: -1 };
        break;
      case 'name_asc':
        sortStage = { name: 1 };
        break;
      case 'founded_desc':
        sortStage = { 'profile.foundedYear': -1, createdAt: -1 };
        break;
      default:
        sortStage = { followerCount: -1, createdAt: -1 };
        break;
    }
    pipeline.push({ $sort: sortStage });

    // Stage 8: Facet for Count & Pagination
    pipeline.push({
      $facet: {
        metadata: [{ $count: 'total' }],
        data: [{ $skip: skip }, { $limit: limitNum }],
      },
    });

    const [facetResult] = await Organization.aggregate(pipeline);
    const total = facetResult?.metadata?.[0]?.total || 0;
    const rawData = facetResult?.data || [];

    // Stage 9: Enhance data with viewer's personal state (isFollowing, isSaved)
    let followingSet = new Set();
    let savedSet = new Set();

    if (currentUserId && rawData.length > 0) {
      const orgIds = rawData.map((d) => d._id);
      const [userFollows, userSaves] = await Promise.all([
        OrganizationFollower.find({
          organizationId: { $in: orgIds },
          userId: currentUserId,
        }).select('organizationId'),
        SavedCompany.find({
          organizationId: { $in: orgIds },
          userId: currentUserId,
        }).select('organizationId'),
      ]);

      followingSet = new Set(userFollows.map((f) => f.organizationId.toString()));
      savedSet = new Set(userSaves.map((s) => s.organizationId.toString()));
    }

    const startups = rawData.map((item) => {
      const orgIdStr = item._id.toString();
      return {
        _id: item._id,
        id: item._id,
        name: item.name,
        slug: item.slug,
        type: item.type,
        logo: item.logo || item.profile?.logo || '',
        coverImage: item.profile?.coverImage || '',
        location: item.location || '',
        website: item.website || '',
        status: item.status,
        tagline: item.profile?.tagline || '',
        description: item.profile?.description || '',
        industry: item.profile?.industry || 'Technology',
        companyStage: item.profile?.companyStage || 'Seed',
        foundedYear: item.profile?.foundedYear || null,
        teamSize: item.profile?.teamSize || '1-10',
        isHiring: item.profile?.isHiring || false,
        isVerified: !!item.isVerified,
        verificationStatus: item.verification?.status || 'unverified',
        followerCount: item.followerCount || 0,
        isFollowing: followingSet.has(orgIdStr),
        isSaved: savedSet.has(orgIdStr),
        createdAt: item.createdAt,
      };
    });

    const totalPages = Math.ceil(total / limitNum);

    return {
      startups,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
      },
    };
  }

  /**
   * Get dynamic filter meta with counts for badges
   */
  async getFilterMeta() {
    const [industries, stages, locations, hiringCount, totalCount] = await Promise.all([
      // Industries with count
      CompanyProfile.aggregate([
        { $match: { isPublished: { $ne: false }, industry: { $ne: '' } } },
        { $group: { _id: '$industry', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 25 },
      ]),

      // Stages with count
      CompanyProfile.aggregate([
        { $match: { isPublished: { $ne: false }, companyStage: { $ne: '' } } },
        { $group: { _id: '$companyStage', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      // Locations with count
      Organization.aggregate([
        { $match: { status: 'active', location: { $ne: '' } } },
        { $group: { _id: '$location', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 },
      ]),

      // Hiring startups count
      CompanyProfile.countDocuments({
        isPublished: { $ne: false },
        isHiring: true,
      }),

      // Total published active startups count
      Organization.countDocuments({ status: 'active' }),
    ]);

    return {
      totalStartups: totalCount,
      hiringCount,
      industries: industries.map((i) => ({ label: i._id, count: i.count })),
      stages: stages.map((s) => ({ label: s._id, count: s.count })),
      locations: locations.map((l) => ({ label: l._id, count: l.count })),
    };
  }

  /**
   * Save a startup to user's saved list
   */
  async saveCompany(userId, organizationId) {
    const org = await Organization.findById(organizationId);
    if (!org) {
      throw ApiError.notFound('Organization not found');
    }

    await SavedCompany.findOneAndUpdate(
      { userId, organizationId },
      { userId, organizationId, createdAt: new Date() },
      { upsert: true, new: true }
    );

    return {
      isSaved: true,
      message: 'Startup saved to your bookmarks',
    };
  }

  /**
   * Remove a startup from user's saved list
   */
  async unsaveCompany(userId, organizationId) {
    await SavedCompany.findOneAndDelete({
      userId,
      organizationId,
    });

    return {
      isSaved: false,
      message: 'Startup removed from your bookmarks',
    };
  }

  /**
   * Get user's saved startups list with pagination
   */
  async getSavedCompanies(userId, queryParams = {}) {
    const pageNum = Math.max(1, parseInt(queryParams.page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(queryParams.limit, 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    const [savedRecords, total] = await Promise.all([
      SavedCompany.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate({
          path: 'organizationId',
          match: { status: 'active' },
        }),
      SavedCompany.countDocuments({ userId }),
    ]);

    const validRecords = savedRecords.filter((r) => r.organizationId != null);
    const orgIds = validRecords.map((r) => r.organizationId._id);

    const [profiles, followerCounts, userFollows] = await Promise.all([
      CompanyProfile.find({ organizationId: { $in: orgIds } }),
      OrganizationFollower.aggregate([
        { $match: { organizationId: { $in: orgIds } } },
        { $group: { _id: '$organizationId', count: { $sum: 1 } } },
      ]),
      OrganizationFollower.find({
        organizationId: { $in: orgIds },
        userId,
      }).select('organizationId'),
    ]);

    const profileMap = new Map(profiles.map((p) => [p.organizationId.toString(), p]));
    const countMap = new Map(followerCounts.map((fc) => [fc._id.toString(), fc.count]));
    const followSet = new Set(userFollows.map((uf) => uf.organizationId.toString()));

    const startups = validRecords.map((rec) => {
      const org = rec.organizationId;
      const orgIdStr = org._id.toString();
      const prof = profileMap.get(orgIdStr);

      return {
        _id: org._id,
        id: org._id,
        name: org.name,
        slug: org.slug,
        type: org.type,
        logo: org.logo || prof?.logo || '',
        coverImage: prof?.coverImage || '',
        location: org.location || '',
        website: org.website || '',
        tagline: prof?.tagline || '',
        industry: prof?.industry || 'Technology',
        companyStage: prof?.companyStage || 'Seed',
        foundedYear: prof?.foundedYear || null,
        teamSize: prof?.teamSize || '1-10',
        isHiring: prof?.isHiring || false,
        followerCount: countMap.get(orgIdStr) || 0,
        isFollowing: followSet.has(orgIdStr),
        isSaved: true,
        savedAt: rec.createdAt,
      };
    });

    const totalPages = Math.ceil(total / limitNum);

    return {
      startups,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
      },
    };
  }
}

module.exports = new DiscoveryService();
