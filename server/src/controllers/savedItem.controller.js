const savedItemService = require('../services/savedItem.service');
const ApiResponse = require('../utils/apiResponse');

class SavedItemController {
  async saveItem(req, res, next) {
    try {
      const { itemType, itemId } = req.params;
      const result = await savedItemService.saveItem(req.user._id, itemType, itemId);
      return ApiResponse.success(res, result.message, result);
    } catch (error) {
      next(error);
    }
  }

  async unsaveItem(req, res, next) {
    try {
      const { itemType, itemId } = req.params;
      const result = await savedItemService.unsaveItem(req.user._id, itemType, itemId);
      return ApiResponse.success(res, result.message, result);
    } catch (error) {
      next(error);
    }
  }

  async getSavedItems(req, res, next) {
    try {
      const result = await savedItemService.getSavedItems(req.user._id, req.query);
      return ApiResponse.success(
        res,
        'Saved items retrieved successfully',
        result.items,
        result.counts
      );
    } catch (error) {
      next(error);
    }
  }

  async isSaved(req, res, next) {
    try {
      const { itemType, itemId } = req.params;
      const result = await savedItemService.isSaved(
        req.user ? req.user._id : null,
        itemType,
        itemId
      );
      return ApiResponse.success(res, 'Saved status retrieved', result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SavedItemController();
