const organizationService = require('../services/organization.service');
const ApiResponse = require('../utils/apiResponse');

class OrganizationController {
  async createOrganization(req, res, next) {
    try {
      const result = await organizationService.createOrganization(req.user._id, req.body);
      return ApiResponse.created(res, 'Organization created successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async getMyOrganizations(req, res, next) {
    try {
      const result = await organizationService.getMyOrganizations(req.user._id);
      return ApiResponse.success(res, 'My organizations retrieved', result);
    } catch (error) {
      next(error);
    }
  }

  async getPublicOrganizations(req, res, next) {
    try {
      const result = await organizationService.getPublicOrganizations(req.query);
      return ApiResponse.success(res, 'Organizations directory retrieved', result);
    } catch (error) {
      next(error);
    }
  }

  async getOrganizationById(req, res, next) {
    try {
      const currentUserId = req.user ? req.user._id : null;
      const result = await organizationService.getOrganizationById(req.params.id, currentUserId);
      return ApiResponse.success(res, 'Organization retrieved', result);
    } catch (error) {
      next(error);
    }
  }

  async updateOrganization(req, res, next) {
    try {
      const result = await organizationService.updateOrganization(
        req.params.id,
        req.body,
        req.user._id,
        req.orgRole
      );
      return ApiResponse.success(res, 'Organization updated successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async getMembers(req, res, next) {
    try {
      const result = await organizationService.getMembers(req.params.id);
      return ApiResponse.success(res, 'Members retrieved', result);
    } catch (error) {
      next(error);
    }
  }

  async inviteMember(req, res, next) {
    try {
      const result = await organizationService.inviteMember(
        req.params.id,
        req.body,
        req.user,
        req.orgRole
      );
      return ApiResponse.created(res, 'Invitation sent successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async getInvitations(req, res, next) {
    try {
      const result = await organizationService.getInvitations(req.params.id);
      return ApiResponse.success(res, 'Pending invitations retrieved', result);
    } catch (error) {
      next(error);
    }
  }

  async cancelInvitation(req, res, next) {
    try {
      const result = await organizationService.cancelInvitation(
        req.params.id,
        req.params.invitationId
      );
      return ApiResponse.success(res, result.message);
    } catch (error) {
      next(error);
    }
  }

  async getInvitationByToken(req, res, next) {
    try {
      const result = await organizationService.getInvitationByToken(req.params.token);
      return ApiResponse.success(res, 'Invitation details retrieved', result);
    } catch (error) {
      next(error);
    }
  }

  async acceptInvitation(req, res, next) {
    try {
      const token = req.body.token || req.query.token;
      const result = await organizationService.acceptInvitation(token, req.user);
      return ApiResponse.success(res, result.message, result);
    } catch (error) {
      next(error);
    }
  }

  async rejectInvitation(req, res, next) {
    try {
      const token = req.body.token || req.query.token;
      const result = await organizationService.rejectInvitation(token);
      return ApiResponse.success(res, result.message);
    } catch (error) {
      next(error);
    }
  }

  async updateMemberRole(req, res, next) {
    try {
      const result = await organizationService.updateMemberRole(
        req.params.id,
        req.params.membershipId,
        req.body.role,
        req.user._id,
        req.orgRole
      );
      return ApiResponse.success(res, 'Member role updated successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async removeMember(req, res, next) {
    try {
      const result = await organizationService.removeMember(
        req.params.id,
        req.params.membershipId,
        req.user._id,
        req.orgRole
      );
      return ApiResponse.success(res, result.message);
    } catch (error) {
      next(error);
    }
  }

  async leaveOrganization(req, res, next) {
    try {
      const result = await organizationService.leaveOrganization(req.params.id, req.user._id);
      return ApiResponse.success(res, result.message);
    } catch (error) {
      next(error);
    }
  }

  async uploadMedia(req, res, next) {
    try {
      const result = await organizationService.uploadMedia(req.file);
      return ApiResponse.created(res, 'File uploaded successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async getPublicProfile(req, res, next) {
    try {
      const currentUserId = req.user ? req.user._id : null;
      const result = await organizationService.getPublicProfile(req.params.id, currentUserId);
      return ApiResponse.success(res, 'Public profile retrieved', result);
    } catch (error) {
      next(error);
    }
  }

  async getStudioData(req, res, next) {
    try {
      const result = await organizationService.getStudioData(req.params.id);
      return ApiResponse.success(res, 'Studio data retrieved', result);
    } catch (error) {
      next(error);
    }
  }

  async saveStudioData(req, res, next) {
    try {
      const result = await organizationService.saveStudioData(req.params.id, req.body);
      return ApiResponse.success(res, result.message, result);
    } catch (error) {
      next(error);
    }
  }

  async followOrganization(req, res, next) {
    try {
      const result = await organizationService.followOrganization(req.params.id, req.user._id);
      return ApiResponse.success(res, 'Following organization', result);
    } catch (error) {
      next(error);
    }
  }

  async unfollowOrganization(req, res, next) {
    try {
      const result = await organizationService.unfollowOrganization(req.params.id, req.user._id);
      return ApiResponse.success(res, 'Unfollowed organization', result);
    } catch (error) {
      next(error);
    }
  }

  async addGalleryItem(req, res, next) {
    try {
      const result = await organizationService.addGalleryItem(req.params.id, req.body);
      return ApiResponse.created(res, 'Gallery item added', result);
    } catch (error) {
      next(error);
    }
  }

  async removeGalleryItem(req, res, next) {
    try {
      const result = await organizationService.removeGalleryItem(
        req.params.id,
        req.params.imageId
      );
      return ApiResponse.success(res, result.message);
    } catch (error) {
      next(error);
    }
  }

  async addProduct(req, res, next) {
    try {
      const result = await organizationService.addProduct(req.params.id, req.body);
      return ApiResponse.created(res, 'Product added successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async removeProduct(req, res, next) {
    try {
      const result = await organizationService.removeProduct(req.params.id, req.params.productId);
      return ApiResponse.success(res, result.message);
    } catch (error) {
      next(error);
    }
  }

  async addMilestone(req, res, next) {
    try {
      const result = await organizationService.addMilestone(req.params.id, req.body);
      return ApiResponse.created(res, 'Milestone added successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async removeMilestone(req, res, next) {
    try {
      const result = await organizationService.removeMilestone(
        req.params.id,
        req.params.milestoneId
      );
      return ApiResponse.success(res, result.message);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new OrganizationController();
