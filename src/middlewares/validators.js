const { body, validationResult } = require('express-validator');
const Category = require('../models/Category');
const Product = require('../models/Product');

// Validation handler to check for errors
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Return early with validation errors
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

const categoryValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Category name is required')
    .isString().withMessage('Category name must be a string')
    .isLength({ max: 50 }).withMessage('Category name must be less than 50 characters')
    .custom(async (value, { req }) => {
      const existing = await Category.findOne({ name: value });
      if (existing && existing._id.toString() !== req.params.id) {
        throw new Error('اسم التصنيف موجود بالفعل. يرجى اختيار اسم آخر.');
      }
      return true;
    }),
  body('displayOrder')
    .optional()
    .isInt({ min: 0 }).withMessage('Display order must be a positive integer'),
  validate
];

const productValidator = [
  body('name')
    .optional()
    .trim()
    .notEmpty().withMessage('Menu item name is required')
    .isString().withMessage('Name must be a string')
    .isLength({ max: 100 }).withMessage('Name must be less than 100 characters')
    .custom(async (value, { req }) => {
      if (!value) return true;
      const existing = await Product.findOne({ name: value });
      if (existing && existing._id.toString() !== req.params.id) {
        throw new Error('اسم المنتج موجود بالفعل. يرجى اختيار اسم آخر.');
      }
      return true;
    }),
  body('description')
    .optional({ checkFalsy: true })
    .isString().withMessage('Description must be a string')
    .trim(),
  body('price')
    .optional({ checkFalsy: true })
    .isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('category')
    .optional()
    .notEmpty().withMessage('Category ID is required')
    .isMongoId().withMessage('Invalid Category ID format'),
  body('isAvailable')
    .optional()
    .isBoolean().withMessage('isAvailable must be a boolean')
    .toBoolean(),
  body('hasSizes')
    .optional()
    .isBoolean().withMessage('hasSizes must be a boolean')
    .toBoolean(),
  body('sizes').custom((value, { req }) => {
    if (req.body.hasSizes === 'true' || req.body.hasSizes === true) {
      if (!value) throw new Error('Sizes are required when hasSizes is true');
      try {
        const parsed = typeof value === 'string' ? JSON.parse(value) : value;
        if (!Array.isArray(parsed) || parsed.length === 0) {
          throw new Error('Sizes must be a non-empty array');
        }
        for (const size of parsed) {
          if (!size.name || typeof size.name !== 'string') throw new Error('Size name is required');
          if (size.price === undefined || size.price === null || Number(size.price) < 0) {
            throw new Error('Size price cannot be negative');
          }
        }
      } catch (e) {
        throw new Error(e.message || 'Invalid sizes format');
      }
    }
    return true;
  }),
  validate
];

module.exports = {
  categoryValidator,
  productValidator
};
