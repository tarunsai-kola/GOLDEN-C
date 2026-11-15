const Organization = require('../models/organization.model');
const CompanyProfile = require('../models/companyProfile.model');
const OrganizationMembership = require('../models/organizationMembership.model');
const OrganizationInvitation = require('../models/organizationInvitation.model');
const VerificationRecord = require('../models/verificationRecord.model');
const OrganizationFollower = require('../models/organizationFollower.model');
const User = require('../models/user.model');
const ApiError = require('../utils/apiError');
const crypto = require('crypto');
const { generateRandomToken } = require('../utils/token');
const { sendInvitationEmail } = require('./email.service');
const {
  ORG_ROLES,
  ALL_ORG_ROLES,
  MEMBERSHIP_STATUS,
  INVITATION_STATUS,
  ORG_STATUS,
} = require('../constants/roles');

class OrganizationService {
  /**
   * Helper to create a unique slug from organization name
   */
  async generateUniqueSlug(name) {
    let baseSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    if (!baseSlug) baseSlug = 'org';

    let slug = baseSlug;
    let counter = 1;
    while (await Organization.exists({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    return slug;
  }

  /**
   * Create an Organization + Company Profile + Owner Membership + Verification Record
   */
  async createOrganization(userId, data) {
    const slug = await this.generateUniqueSlug(data.name);

    const org = new Organization({
      name: data.name,
      slug,
      type: data.type || 'company',
      logo: data.logo || '',
      location: data.location || '',
      website: data.website || '',
      status: ORG_STATUS.ACTIVE,
      createdBy: userId,
    });

    await org.save();

    const profile = new CompanyProfile({
      organizationId: org._id,
      tagline: data.tagline || '',
      description: data.description || '',
      industry: data.industry || 'Technology',
      foundedYear: data.foundedYear || new Date().getFullYear(),
      companyStage: data.companyStage || 'Seed',
      teamSize: data.teamSize || '1-10',
      isHiring: data.isHiring || false,
      socialLinks: data.socialLinks || {},
    });

    await profile.save();

    // Create founder's membership as Owner
    const membership = new OrganizationMembership({
      organizationId: org._id,
      userId,
      role: ORG_ROLES.OWNER,
      status: MEMBERSHIP_STATUS.ACTIVE,
      title: 'Founder & CEO',
    });

    await membership.save();

    // Create initial verification record
    const verificationRecord = new VerificationRecord({
      organizationId: org._id,
      status: 'unverified',
      submittedBy: userId,
    });

    await verificationRecord.save();

    return {
      organization: org,
      profile,
      membership,
    };
  }

  /**
   * Get all organizations where current user has an active membership
   */
  async getMyOrganizations(userId) {
    const memberships = await OrganizationMembership.find({
      userId,
      status: MEMBERSHIP_STATUS.ACTIVE,
    }).populate('organizationId');

    const validMemberships = memberships.filter((m) => m.organizationId != null);
    const orgIds = validMemberships.map((m) => m.organizationId._id);

    const profiles = await CompanyProfile.find({ organizationId: { $in: orgIds } });
    const profileMap = new Map(profiles.map((p) => [p.organizationId.toString(), p]));

    return validMemberships.map((m) => {
      const org = m.organizationId.toJSON ? m.organizationId.toJSON() : m.organizationId;
      return {
        ...org,
        profile: profileMap.get(org._id.toString()) || null,
        myMembership: {
          id: m._id,
          role: m.role,
          title: m.title,
          department: m.department,
          joinedAt: m.joinedAt,
        },
      };
    });
  }

  /**
   * Public discovery: list public organizations with search and filters
   */
  async getPublicOrganizations(query = {}) {
    const { search, industry, type, stage, page = 1, limit = 20 } = query;
    const filter = { status: ORG_STATUS.ACTIVE };

    if (type) {
      filter.type = type;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [orgs, total] = await Promise.all([
      Organization.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10)),
      Organization.countDocuments(filter),
    ]);

    const orgIds = orgs.map((o) => o._id);
    const profileQuery = { organizationId: { $in: orgIds } };
    if (industry) profileQuery.industry = { $regex: industry, $options: 'i' };
    if (stage) profileQuery.companyStage = stage;

    const profiles = await CompanyProfile.find(profileQuery);
    const profileMap = new Map(profiles.map((p) => [p.organizationId.toString(), p]));

    // Fetch active member counts
    const memberCounts = await OrganizationMembership.aggregate([
      { $match: { organizationId: { $in: orgIds }, status: MEMBERSHIP_STATUS.ACTIVE } },
      { $group: { _id: '$organizationId', count: { $sum: 1 } } },
    ]);
    const memberCountMap = new Map(memberCounts.map((mc) => [mc._id.toString(), mc.count]));

    const results = orgs
      .filter((org) => {
        if ((industry || stage) && !profileMap.has(org._id.toString())) {
          return false;
        }
        return true;
      })
      .map((org) => {
        const o = org.toJSON();
        return {
          ...o,
          profile: profileMap.get(org._id.toString()) || null,
          memberCount: memberCountMap.get(org._id.toString()) || 0,
        };
      });

    return {
      organizations: results,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
      },
    };
  }

  /**
   * Get single organization by ID or slug
   */
  async getOrganizationById(idOrSlug, currentUserId = null) {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(idOrSlug);
    const query = isObjectId ? { _id: idOrSlug } : { slug: idOrSlug.toLowerCase() };

    const org = await Organization.findOne(query);
    if (!org) {
      throw ApiError.notFound('Organization not found');
    }

    const [profile, memberCount, myMembership, verification] = await Promise.all([
      CompanyProfile.findOne({ organizationId: org._id }),
      OrganizationMembership.countDocuments({
        organizationId: org._id,
        status: MEMBERSHIP_STATUS.ACTIVE,
      }),
      currentUserId
        ? OrganizationMembership.findOne({
            organizationId: org._id,
            userId: currentUserId,
            status: MEMBERSHIP_STATUS.ACTIVE,
          })
        : null,
      VerificationRecord.findOne({ organizationId: org._id }),
    ]);

    return {
      ...org.toJSON(),
      profile: profile || null,
      memberCount,
      verificationStatus: verification?.status || 'unverified',
      myRole: myMembership?.role || null,
      myMembership: myMembership || null,
    };
  }

  /**
   * Update organization and its company profile
   */
  async updateOrganization(orgId, data) {
    const org = await Organization.findById(orgId);
    if (!org) {
      throw ApiError.notFound('Organization not found');
    }

    // Update org top-level fields
    if (data.name !== undefined) org.name = data.name;
    if (data.logo !== undefined) org.logo = data.logo;
    if (data.location !== undefined) org.location = data.location;
    if (data.website !== undefined) org.website = data.website;
    if (data.type !== undefined) org.type = data.type;
    await org.save();

    // Update or create CompanyProfile
    let profile = await CompanyProfile.findOne({ organizationId: org._id });
    if (!profile) {
      profile = new CompanyProfile({ organizationId: org._id });
    }

    if (data.tagline !== undefined) profile.tagline = data.tagline;
    if (data.description !== undefined) profile.description = data.description;
    if (data.industry !== undefined) profile.industry = data.industry;
    if (data.foundedYear !== undefined) profile.foundedYear = data.foundedYear;
    if (data.companyStage !== undefined) profile.companyStage = data.companyStage;
    if (data.teamSize !== undefined) profile.teamSize = data.teamSize;
    if (data.isHiring !== undefined) profile.isHiring = data.isHiring;
    if (data.socialLinks !== undefined) {
      profile.socialLinks = { ...profile.socialLinks, ...data.socialLinks };
    }

    await profile.save();

    return {
      organization: org,
      profile,
    };
  }

  /**
   * List members of an organization
   */
  async getMembers(orgId) {
    const memberships = await OrganizationMembership.find({
      organizationId: orgId,
      status: MEMBERSHIP_STATUS.ACTIVE,
    })
      .populate('userId', 'fullName email location role status')
      .sort({ createdAt: 1 });

    return memberships.map((m) => ({
      membershipId: m._id,
      role: m.role,
      status: m.status,
      title: m.title,
      department: m.department,
      joinedAt: m.joinedAt,
      user: m.userId,
    }));
  }

  /**
   * Send an invitation to a prospective member
   */
  async inviteMember(orgId, { email, role }, inviterUser, currentRole) {
    // Only Owner and Administrator can invite
    if (![ORG_ROLES.OWNER, ORG_ROLES.ADMINISTRATOR].includes(currentRole)) {
      throw ApiError.forbidden('Only an Owner or Administrator can invite new members');
    }

    // Administrator cannot invite an Owner
    if (currentRole === ORG_ROLES.ADMINISTRATOR && role === ORG_ROLES.OWNER) {
      throw ApiError.forbidden('Administrators cannot invite members as Owner');
    }

    const org = await Organization.findById(orgId);
    if (!org) {
      throw ApiError.notFound('Organization not found');
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if user is already an active member
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      const activeMember = await OrganizationMembership.findOne({
        organizationId: orgId,
        userId: existingUser._id,
        status: MEMBERSHIP_STATUS.ACTIVE,
      });
      if (activeMember) {
        throw ApiError.conflict('User is already an active member of this organization');
      }
    }

    // Check for existing pending invitation
    let invite = await OrganizationInvitation.findOne({
      organizationId: orgId,
      email: cleanEmail,
      status: INVITATION_STATUS.PENDING,
    });

    const token = generateRandomToken(32);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    if (invite) {
      invite.token = token;
      invite.role = role;
      invite.expiresAt = expiresAt;
      invite.invitedBy = inviterUser._id;
      await invite.save();
    } else {
      invite = new OrganizationInvitation({
        organizationId: orgId,
        email: cleanEmail,
        role,
        invitedBy: inviterUser._id,
        token,
        expiresAt,
        status: INVITATION_STATUS.PENDING,
      });
      await invite.save();
    }

    // Send invitation email
    await sendInvitationEmail(
      cleanEmail,
      org.name,
      inviterUser.fullName,
      role,
      token
    );

    return {
      invitation: invite,
      token, // returned for verification / test ease
    };
  }

  /**
   * List pending invitations for an organization
   */
  async getInvitations(orgId) {
    return OrganizationInvitation.find({
      organizationId: orgId,
      status: INVITATION_STATUS.PENDING,
    })
      .populate('invitedBy', 'fullName email')
      .sort({ createdAt: -1 });
  }

  /**
   * Cancel a pending invitation
   */
  async cancelInvitation(orgId, invitationId) {
    const invite = await OrganizationInvitation.findOne({
      _id: invitationId,
      organizationId: orgId,
      status: INVITATION_STATUS.PENDING,
    });

    if (!invite) {
      throw ApiError.notFound('Pending invitation not found');
    }

    invite.status = INVITATION_STATUS.CANCELED;
    await invite.save();

    return { message: 'Invitation canceled successfully' };
  }

  /**
   * Inspect invitation details by token
   */
  async getInvitationByToken(token) {
    const invite = await OrganizationInvitation.findOne({
      token,
      status: INVITATION_STATUS.PENDING,
      expiresAt: { $gt: Date.now() },
    })
      .populate('organizationId', 'name slug logo location website')
      .populate('invitedBy', 'fullName email');

    if (!invite) {
      throw ApiError.notFound('Invalid or expired invitation token');
    }

    return invite;
  }

  /**
   * Accept an invitation using token
   */
  async acceptInvitation(token, user) {
    const invite = await OrganizationInvitation.findOne({
      token,
      status: INVITATION_STATUS.PENDING,
      expiresAt: { $gt: Date.now() },
    });

    if (!invite) {
      throw ApiError.badRequest('Invalid or expired invitation token');
    }

    // Check if membership already exists
    let membership = await OrganizationMembership.findOne({
      organizationId: invite.organizationId,
      userId: user._id,
    });

    if (membership && membership.status === MEMBERSHIP_STATUS.ACTIVE) {
      invite.status = INVITATION_STATUS.ACCEPTED;
      await invite.save();
      throw ApiError.conflict('You are already an active member of this organization');
    }

    if (membership) {
      membership.role = invite.role;
      membership.status = MEMBERSHIP_STATUS.ACTIVE;
      membership.joinedAt = new Date();
      await membership.save();
    } else {
      membership = new OrganizationMembership({
        organizationId: invite.organizationId,
        userId: user._id,
        role: invite.role,
        status: MEMBERSHIP_STATUS.ACTIVE,
      });
      await membership.save();
    }

    invite.status = INVITATION_STATUS.ACCEPTED;
    await invite.save();

    const org = await Organization.findById(invite.organizationId);

    return {
      membership,
      organization: org,
      message: `Successfully joined ${org ? org.name : 'the organization'} as ${invite.role}`,
    };
  }

  /**
   * Reject an invitation
   */
  async rejectInvitation(token) {
    const invite = await OrganizationInvitation.findOne({
      token,
      status: INVITATION_STATUS.PENDING,
    });

    if (!invite) {
      throw ApiError.badRequest('Invalid or expired invitation token');
    }

    invite.status = INVITATION_STATUS.REJECTED;
    await invite.save();

    return { message: 'Invitation declined' };
  }

  /**
   * Update role of an organization member
   */
  async updateMemberRole(orgId, membershipId, newRole, currentUserId, currentRole) {
    if (!ALL_ORG_ROLES.includes(newRole)) {
      throw ApiError.badRequest(`Invalid role: ${newRole}`);
    }

    const targetMembership = await OrganizationMembership.findOne({
      _id: membershipId,
      organizationId: orgId,
    });

    if (!targetMembership) {
      throw ApiError.notFound('Member not found in this organization');
    }

    // Architectural Constraints:
    // 1. Administrator cannot change the role of an Owner
    if (currentRole === ORG_ROLES.ADMINISTRATOR && targetMembership.role === ORG_ROLES.OWNER) {
      throw ApiError.forbidden('Administrators cannot modify an Owner role');
    }

    // 2. Administrator cannot promote anyone to Owner
    if (currentRole === ORG_ROLES.ADMINISTRATOR && newRole === ORG_ROLES.OWNER) {
      throw ApiError.forbidden('Administrators cannot promote members to Owner');
    }

    // 3. If demoting an Owner to another role, check that there is at least one other active Owner
    if (targetMembership.role === ORG_ROLES.OWNER && newRole !== ORG_ROLES.OWNER) {
      const otherOwnersCount = await OrganizationMembership.countDocuments({
        organizationId: orgId,
        role: ORG_ROLES.OWNER,
        status: MEMBERSHIP_STATUS.ACTIVE,
        _id: { $ne: targetMembership._id },
      });
      if (otherOwnersCount === 0) {
        throw ApiError.badRequest('Cannot demote the sole Owner. Transfer or designate another Owner first.');
      }
    }

    targetMembership.role = newRole;
    await targetMembership.save();

    return targetMembership;
  }

  /**
   * Remove a member from the organization
   */
  async removeMember(orgId, membershipId, currentUserId, currentRole) {
    const targetMembership = await OrganizationMembership.findOne({
      _id: membershipId,
      organizationId: orgId,
    });

    if (!targetMembership) {
      throw ApiError.notFound('Member not found in this organization');
    }

    // Architectural Constraints:
    // 1. Cannot remove an Owner unless you are an Owner
    if (targetMembership.role === ORG_ROLES.OWNER && currentRole !== ORG_ROLES.OWNER) {
      throw ApiError.forbidden('Only an Owner can remove an Owner');
    }

    // 2. Cannot remove the sole Owner
    if (targetMembership.role === ORG_ROLES.OWNER) {
      const otherOwners = await OrganizationMembership.countDocuments({
        organizationId: orgId,
        role: ORG_ROLES.OWNER,
        status: MEMBERSHIP_STATUS.ACTIVE,
        _id: { $ne: targetMembership._id },
      });
      if (otherOwners === 0) {
        throw ApiError.badRequest('Cannot remove the sole Owner of an organization');
      }
    }

    // 3. Administrator cannot remove another Administrator
    if (
      currentRole === ORG_ROLES.ADMINISTRATOR &&
      targetMembership.role === ORG_ROLES.ADMINISTRATOR &&
      targetMembership.userId.toString() !== currentUserId.toString()
    ) {
      throw ApiError.forbidden('Administrators cannot remove fellow Administrators');
    }

    // Delete or mark inactive
    await OrganizationMembership.findByIdAndDelete(targetMembership._id);

    return { message: 'Member removed successfully from organization' };
  }

  /**
   * Member leaves organization
   */
  async leaveOrganization(orgId, userId) {
    const membership = await OrganizationMembership.findOne({
      organizationId: orgId,
      userId,
      status: MEMBERSHIP_STATUS.ACTIVE,
    });

    if (!membership) {
      throw ApiError.notFound('Active membership not found');
    }

    // Owner cannot leave if they are the sole owner
    if (membership.role === ORG_ROLES.OWNER) {
      const otherOwners = await OrganizationMembership.countDocuments({
        organizationId: orgId,
        role: ORG_ROLES.OWNER,
        status: MEMBERSHIP_STATUS.ACTIVE,
        userId: { $ne: userId },
      });
      if (otherOwners === 0) {
        throw ApiError.badRequest(
          'You are the sole Owner. Please transfer ownership to another member before leaving.'
        );
      }
    }

    await OrganizationMembership.findByIdAndDelete(membership._id);

    return { message: 'You have left the organization successfully' };
  }

  /**
   * Upload media file (returns public URL)
   */
  async uploadMedia(file) {
    if (!file) {
      throw ApiError.badRequest('No file uploaded');
    }

    const publicUrl = `/uploads/${file.filename}`;
    return {
      url: publicUrl,
      filename: file.filename,
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  /**
   * Get public profile with full aggregated data
   */
  async getPublicProfile(idOrSlug, currentUserId = null) {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(idOrSlug);
    const query = isObjectId ? { _id: idOrSlug } : { slug: idOrSlug.toLowerCase() };

    const org = await Organization.findOne(query);
    if (!org) {
      throw ApiError.notFound('Organization not found');
    }

    let profile = await CompanyProfile.findOne({ organizationId: org._id });
    if (!profile) {
      profile = new CompanyProfile({ organizationId: org._id });
      await profile.save();
    }

    // Follower stats
    const followerCount = await OrganizationFollower.countDocuments({
      organizationId: org._id,
    });

    let isFollowing = false;
    let myRole = null;
    let myMembership = null;

    if (currentUserId) {
      const [followRecord, userMembership] = await Promise.all([
        OrganizationFollower.exists({
          organizationId: org._id,
          userId: currentUserId,
        }),
        OrganizationMembership.findOne({
          organizationId: org._id,
          userId: currentUserId,
          status: MEMBERSHIP_STATUS.ACTIVE,
        }),
      ]);
      isFollowing = !!followRecord;
      myRole = userMembership?.role || null;
      myMembership = userMembership;
    }

    // Draft mode check: if unpublished, only editors/admins/owners can view
    const isPrivileged = [ORG_ROLES.OWNER, ORG_ROLES.ADMINISTRATOR, ORG_ROLES.EDITOR].includes(
      myRole
    );
    if (!profile.isPublished && !isPrivileged) {
      return {
        organization: org,
        isPublished: false,
        message: 'This company profile is currently in draft mode.',
      };
    }

    // Public team members
    const teamMemberships = await OrganizationMembership.find({
      organizationId: org._id,
      status: MEMBERSHIP_STATUS.ACTIVE,
      isPublicTeamMember: true,
    })
      .populate('userId', 'fullName email location')
      .sort({ createdAt: 1 });

    const team = teamMemberships.map((m) => ({
      membershipId: m._id,
      role: m.role,
      title: m.title || m.role,
      department: m.department,
      bio: m.bio,
      photo: m.photo,
      joinedAt: m.joinedAt,
      user: m.userId,
    }));

    return {
      organization: org,
      profile,
      team,
      followerCount,
      isFollowing,
      myRole,
      myMembership,
    };
  }

  /**
   * Get Studio Data for editing
   */
  async getStudioData(orgId) {
    const org = await Organization.findById(orgId);
    if (!org) {
      throw ApiError.notFound('Organization not found');
    }

    let profile = await CompanyProfile.findOne({ organizationId: org._id });
    if (!profile) {
      profile = new CompanyProfile({ organizationId: org._id });
      await profile.save();
    }

    const [team, followerCount, verification] = await Promise.all([
      OrganizationMembership.find({
        organizationId: org._id,
        status: MEMBERSHIP_STATUS.ACTIVE,
      }).populate('userId', 'fullName email location'),
      OrganizationFollower.countDocuments({ organizationId: org._id }),
      VerificationRecord.findOne({ organizationId: org._id }),
    ]);

    return {
      organization: org,
      profile,
      team,
      followerCount,
      verificationStatus: verification?.status || 'unverified',
    };
  }

  /**
   * Save Studio Data (Draft or Publish)
   */
  async saveStudioData(orgId, updateData) {
    const { action = 'publish', ...fields } = updateData;

    const org = await Organization.findById(orgId);
    if (!org) {
      throw ApiError.notFound('Organization not found');
    }

    let profile = await CompanyProfile.findOne({ organizationId: org._id });
    if (!profile) {
      profile = new CompanyProfile({ organizationId: org._id });
    }

    if (action === 'draft') {
      profile.draftData = { ...(profile.draftData || {}), ...fields };
      await profile.save();
      return {
        profile,
        message: 'Draft saved successfully',
      };
    }

    // Direct publish action
    const allowedFields = [
      'tagline',
      'description',
      'industry',
      'foundedYear',
      'companyStage',
      'teamSize',
      'isHiring',
      'coverImage',
      'logo',
      'problemSolved',
      'targetAudience',
      'mission',
      'vision',
      'products',
      'milestones',
      'gallery',
      'updates',
      'mediaFeatures',
      'socialLinks',
      'contactInfo',
      'sectionOrder',
    ];

    allowedFields.forEach((field) => {
      if (fields[field] !== undefined) {
        profile[field] = fields[field];
      }
    });

    if (fields.logo !== undefined) {
      org.logo = fields.logo;
    }
    if (fields.name !== undefined) {
      org.name = fields.name;
    }
    if (fields.location !== undefined) {
      org.location = fields.location;
    }
    if (fields.website !== undefined) {
      org.website = fields.website;
    }

    profile.isPublished = true;
    profile.draftData = null; // Clear draft once published

    await Promise.all([profile.save(), org.save()]);

    return {
      organization: org,
      profile,
      message: 'Profile published successfully',
    };
  }

  /**
   * Follow an organization
   */
  async followOrganization(orgId, userId) {
    const org = await Organization.findById(orgId);
    if (!org) {
      throw ApiError.notFound('Organization not found');
    }

    await OrganizationFollower.findOneAndUpdate(
      { organizationId: org._id, userId },
      { organizationId: org._id, userId, createdAt: new Date() },
      { upsert: true, new: true }
    );

    const followerCount = await OrganizationFollower.countDocuments({
      organizationId: org._id,
    });

    return {
      isFollowing: true,
      followerCount,
    };
  }

  /**
   * Unfollow an organization
   */
  async unfollowOrganization(orgId, userId) {
    await OrganizationFollower.findOneAndDelete({
      organizationId: orgId,
      userId,
    });

    const followerCount = await OrganizationFollower.countDocuments({
      organizationId: orgId,
    });

    return {
      isFollowing: false,
      followerCount,
    };
  }

  /**
   * Add gallery item
   */
  async addGalleryItem(orgId, itemData) {
    let profile = await CompanyProfile.findOne({ organizationId: orgId });
    if (!profile) {
      profile = new CompanyProfile({ organizationId: orgId });
    }

    const item = {
      id: crypto.randomUUID(),
      url: itemData.url,
      caption: itemData.caption || '',
      category: itemData.category || 'office',
      order: itemData.order || profile.gallery.length,
    };

    profile.gallery.push(item);
    await profile.save();

    return item;
  }

  /**
   * Remove gallery item
   */
  async removeGalleryItem(orgId, imageId) {
    const profile = await CompanyProfile.findOne({ organizationId: orgId });
    if (!profile) {
      throw ApiError.notFound('Profile not found');
    }

    profile.gallery = profile.gallery.filter(
      (g) => g.id !== imageId && g._id?.toString() !== imageId
    );
    await profile.save();

    return { message: 'Gallery item removed successfully' };
  }

  /**
   * Add product item
   */
  async addProduct(orgId, productData) {
    let profile = await CompanyProfile.findOne({ organizationId: orgId });
    if (!profile) {
      profile = new CompanyProfile({ organizationId: orgId });
    }

    const product = {
      id: crypto.randomUUID(),
      name: productData.name,
      description: productData.description || '',
      image: productData.image || '',
      category: productData.category || 'Software',
      link: productData.link || '',
      status: productData.status || 'Live',
    };

    profile.products.push(product);
    await profile.save();

    return product;
  }

  /**
   * Remove product item
   */
  async removeProduct(orgId, productId) {
    const profile = await CompanyProfile.findOne({ organizationId: orgId });
    if (!profile) {
      throw ApiError.notFound('Profile not found');
    }

    profile.products = profile.products.filter(
      (p) => p.id !== productId && p._id?.toString() !== productId
    );
    await profile.save();

    return { message: 'Product removed successfully' };
  }

  /**
   * Add milestone
   */
  async addMilestone(orgId, milestoneData) {
    let profile = await CompanyProfile.findOne({ organizationId: orgId });
    if (!profile) {
      profile = new CompanyProfile({ organizationId: orgId });
    }

    const milestone = {
      id: crypto.randomUUID(),
      title: milestoneData.title,
      description: milestoneData.description || '',
      date: milestoneData.date || '',
      category: milestoneData.category || 'Company',
    };

    profile.milestones.push(milestone);
    await profile.save();

    return milestone;
  }

  /**
   * Remove milestone
   */
  async removeMilestone(orgId, milestoneId) {
    const profile = await CompanyProfile.findOne({ organizationId: orgId });
    if (!profile) {
      throw ApiError.notFound('Profile not found');
    }

    profile.milestones = profile.milestones.filter(
      (m) => m.id !== milestoneId && m._id?.toString() !== milestoneId
    );
    await profile.save();

    return { message: 'Milestone removed successfully' };
  }
}

module.exports = new OrganizationService();
