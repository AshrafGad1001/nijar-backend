const Bundle = require('../models/Bundle');
const Product = require('../models/Product');
const { triggerFrontendRevalidate } = require('../utils/revalidate');

// @desc    Create new bundle
// @route   POST /api/v1/bundles
// @access  Private/Admin
exports.createBundle = async (req, res, next) => {
  try {
    const { name, description, products, discountPercentage, isAvailable, displayOrder } = req.body;

    // Validate products exist
    if (!products || products.length < 2) {
      return res.status(400).json({ success: false, message: 'يجب اختيار منتجين على الأقل' });
    }

    const existingProducts = await Product.find({ _id: { $in: products } });
    if (existingProducts.length !== products.length) {
      return res.status(400).json({ success: false, message: 'بعض المنتجات المختارة غير موجودة' });
    }

    const bundle = await Bundle.create({
      name,
      description,
      products,
      discountPercentage,
      isAvailable: isAvailable !== undefined ? isAvailable : true,
      displayOrder: displayOrder || 0
    });

    triggerFrontendRevalidate('bundles');
    triggerFrontendRevalidate('catalog');

    res.status(201).json({ success: true, data: bundle });
  } catch (error) {
    next(error);
  }
};

// @desc    Update bundle
// @route   PUT /api/v1/bundles/:id
// @access  Private/Admin
exports.updateBundle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, products, discountPercentage, isAvailable, displayOrder } = req.body;

    let bundle = await Bundle.findById(id);
    if (!bundle) {
      return res.status(404).json({ success: false, message: 'الباكدج غير موجود' });
    }

    if (products) {
      if (products.length < 2) {
        return res.status(400).json({ success: false, message: 'يجب اختيار منتجين على الأقل' });
      }
      const existingProducts = await Product.find({ _id: { $in: products } });
      if (existingProducts.length !== products.length) {
        return res.status(400).json({ success: false, message: 'بعض المنتجات المختارة غير موجودة' });
      }
      bundle.products = products;
    }

    if (name) bundle.name = name;
    if (description !== undefined) bundle.description = description;
    if (discountPercentage !== undefined) bundle.discountPercentage = discountPercentage;
    if (isAvailable !== undefined) bundle.isAvailable = isAvailable;
    if (displayOrder !== undefined) bundle.displayOrder = displayOrder;

    await bundle.save();

    triggerFrontendRevalidate('bundles');
    triggerFrontendRevalidate('catalog');

    res.status(200).json({ success: true, data: bundle });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete bundle
// @route   DELETE /api/v1/bundles/:id
// @access  Private/Admin
exports.deleteBundle = async (req, res, next) => {
  try {
    const bundle = await Bundle.findById(req.params.id);
    if (!bundle) {
      return res.status(404).json({ success: false, message: 'الباكدج غير موجود' });
    }

    await bundle.deleteOne();
    
    triggerFrontendRevalidate('bundles');
    triggerFrontendRevalidate('catalog');
    
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all bundles for Admin
// @route   GET /api/v1/bundles
// @access  Private/Admin
exports.getAdminBundles = async (req, res, next) => {
  try {
    const bundles = await Bundle.find()
      .populate('products', 'name productCode isAvailable price image sizes')
      .sort({ displayOrder: 1, createdAt: -1 });

    res.status(200).json({ success: true, count: bundles.length, data: bundles });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single bundle for Admin
// @route   GET /api/v1/bundles/:id
// @access  Private/Admin
exports.getBundle = async (req, res, next) => {
  try {
    const bundle = await Bundle.findById(req.params.id)
      .populate('products', 'name productCode isAvailable price image sizes');
      
    if (!bundle) {
      return res.status(404).json({ success: false, message: 'الباكدج غير موجود' });
    }

    res.status(200).json({ success: true, data: bundle });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all available bundles for public catalog
// @route   GET /api/v1/catalog/bundles
// @access  Public
exports.getPublicBundles = async (req, res, next) => {
  try {
    const bundles = await Bundle.find({ isAvailable: true })
      .populate({
        path: 'products',
        select: 'name price image sizes hasSizes isAvailable',
        match: { isAvailable: true }
      })
      .sort({ displayOrder: 1, createdAt: -1 });

    // Filter out bundles that have unavailable products in them
    // (If a product was hard-deleted, it would be null, if isAvailable=false, it would be missing due to match)
    const validBundles = bundles.filter(b => b.products && b.products.length >= 2);

    res.status(200).json({ success: true, count: validBundles.length, data: validBundles });
  } catch (error) {
    next(error);
  }
};

// @desc    Get bundle by slug for public catalog
// @route   GET /api/v1/catalog/bundles/:slug
// @access  Public
exports.getBundleBySlug = async (req, res, next) => {
  try {
    const bundle = await Bundle.findOne({ slug: req.params.slug, isAvailable: true })
      .populate({
        path: 'products',
        select: 'name productCode description components price hasSizes sizes technicalDetails image gallery category isAvailable',
        populate: { path: 'category', select: 'name' }
      });

    if (!bundle) {
      return res.status(404).json({ success: false, message: 'الباكدج غير موجود أو غير متاح' });
    }

    // Check if any product inside is unavailable or deleted
    const hasInvalidProducts = bundle.products.some(p => !p || !p.isAvailable);
    if (hasInvalidProducts) {
      return res.status(404).json({ success: false, message: 'الباكدج غير متاح حالياً لوجود منتجات غير متوفرة' });
    }

    res.status(200).json({ success: true, data: bundle });
  } catch (error) {
    next(error);
  }
};
