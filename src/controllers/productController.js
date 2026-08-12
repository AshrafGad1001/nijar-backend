const Product = require('../models/Product');
const Category = require('../models/Category');
const Bundle = require('../models/Bundle');
const cloudinary = require('../config/cloudinary');

// Helper: upload buffer to Cloudinary
const uploadToCloudinary = (fileBuffer, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => {
        if (error) return reject(error);
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(fileBuffer);
  });
};

// Helper: delete image from Cloudinary safely
const destroyFromCloudinary = async (publicId) => {
  if (publicId) {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (err) {
      console.error('Cloudinary destroy error:', err.message);
    }
  }
};

exports.uploadSingleImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded' });
    }
    const folder = req.body.folder || 'nijar/items';
    const result = await uploadToCloudinary(req.file.buffer, folder);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

exports.getProducts = async (req, res, next) => {
  try {
    const query = req.query.category ? { category: req.query.category } : {};

    const items = await Product.find(query)
      .sort({ displayOrder: 1 })
      .populate('category', 'name');

    res.status(200).json({ success: true, count: items.length, data: items });
  } catch (error) {
    next(error);
  }
};

exports.getProductById = async (req, res, next) => {
  try {
    const item = await Product.findById(req.params.id).populate('category', 'name');
    if (!item) {
      return res.status(404).json({ success: false, message: 'المنتج غير موجود' });
    }
    res.status(200).json({ success: true, data: item });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ success: false, message: 'المنتج غير موجود' });
    }
    next(error);
  }
};

exports.createProduct = async (req, res, next) => {
  try {
    const { name, description, price, category, isAvailable, productCode, discountPercentage } = req.body;

    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({ success: false, message: 'Category not found' });
    }

    const count = await Product.countDocuments({ category });

    let parsedHasSizes = req.body.hasSizes === 'true' || req.body.hasSizes === true;
    let parsedIsBestSeller = req.body.isBestSeller === 'true' || req.body.isBestSeller === true;
    let parsedIsHeroSlide = req.body.isHeroSlide === 'true' || req.body.isHeroSlide === true;

    if (parsedIsBestSeller) {
      const bestSellerCount = await Product.countDocuments({ isBestSeller: true });
      if (bestSellerCount >= 10) {
        return res.status(400).json({ success: false, message: 'لا يمكن إضافة أكثر من 10 عناصر لقائمة الأبرز' });
      }
    }

    if (parsedIsHeroSlide) {
      const heroSlideCount = await Product.countDocuments({ isHeroSlide: true });
      if (heroSlideCount >= 10) {
        return res.status(400).json({ success: false, message: 'لا يمكن إضافة أكثر من 10 عناصر للعرض الرئيسي' });
      }
    }

    let parsedSizes = [];
    if (parsedHasSizes) {
      if (req.body.sizes) {
        try {
          parsedSizes = typeof req.body.sizes === 'string' ? JSON.parse(req.body.sizes) : req.body.sizes;
        } catch (e) {
          return res.status(400).json({ success: false, message: 'Invalid sizes format' });
        }
      }
      const validSizes = parsedSizes.filter(s => s.name && Number(s.price) > 0);
      if (validSizes.length === 0) {
        return res.status(400).json({ success: false, message: 'At least one valid size is required' });
      }
      parsedSizes = validSizes;
    }

    let parsedTechnicalDetails = {};
    if (req.body.technicalDetails) {
      try {
        parsedTechnicalDetails = typeof req.body.technicalDetails === 'string'
          ? JSON.parse(req.body.technicalDetails)
          : req.body.technicalDetails;
      } catch (e) {
        return res.status(400).json({ success: false, message: 'Invalid technical details format' });
      }
    }

    let parsedComponents = [];
    if (req.body.components) {
      try {
        const arr = typeof req.body.components === 'string'
          ? JSON.parse(req.body.components)
          : req.body.components;
        if (Array.isArray(arr)) {
          parsedComponents = [...new Set(arr.map(c => typeof c === 'string' ? c.trim() : '').filter(c => c.length > 0 && c.length <= 50))];
          if (parsedComponents.length > 20) parsedComponents = parsedComponents.slice(0, 20);
        }
      } catch (e) {
        return res.status(400).json({ success: false, message: 'Invalid components format' });
      }
    }

    const itemData = {
      components: parsedComponents,
      productCode: productCode ? productCode.toUpperCase() : undefined,
      name,
      description,
      price: parsedHasSizes ? null : price,
      discountPercentage: discountPercentage ? Number(discountPercentage) : 0,
      category,
      isAvailable,
      isBestSeller: parsedIsBestSeller,
      isHeroSlide: parsedIsHeroSlide,
      hasSizes: parsedHasSizes,
      sizes: parsedSizes,
      technicalDetails: parsedTechnicalDetails,
      displayOrder: count + 1,
      gallery: [],
    };

    // Handle cover image upload
    if (req.files && req.files.image && req.files.image[0]) {
      const result = await uploadToCloudinary(req.files.image[0].buffer, 'nijar/items');
      itemData.image = result;
    } else if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, 'nijar/items');
      itemData.image = result;
    } else if (req.body.image) {
      itemData.image = typeof req.body.image === 'string' ? JSON.parse(req.body.image) : req.body.image;
    }

    // Handle gallery images upload
    if (req.files && req.files.gallery && req.files.gallery.length > 0) {
      const galleryUploads = await Promise.all(
        req.files.gallery.map(f => uploadToCloudinary(f.buffer, 'nijar/gallery'))
      );
      itemData.gallery = galleryUploads;
    } else if (req.body.gallery) {
      itemData.gallery = typeof req.body.gallery === 'string' ? JSON.parse(req.body.gallery) : req.body.gallery;
    }

    const item = await Product.create(itemData);
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'كود المنتج موجود بالفعل. يرجى إدخال كود فريد.' });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    next(error);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    if (req.body.productCode) {
      req.body.productCode = req.body.productCode.toUpperCase();
    }
    
    if (req.body.category) {
      const categoryExists = await Category.findById(req.body.category);
      if (!categoryExists) {
        return res.status(400).json({ success: false, message: 'Category not found' });
      }
    }

    const item = await Product.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    // Handle isBestSeller limit
    if (req.body.isBestSeller !== undefined) {
      const parsedIsBestSeller = req.body.isBestSeller === 'true' || req.body.isBestSeller === true;
      if (parsedIsBestSeller && !item.isBestSeller) {
        const bestSellerCount = await Product.countDocuments({ isBestSeller: true });
        if (bestSellerCount >= 10) {
          return res.status(400).json({ success: false, message: 'لا يمكن إضافة أكثر من 10 عناصر لقائمة الأبرز' });
        }
      }
      req.body.isBestSeller = parsedIsBestSeller;
    }

    // Handle isHeroSlide limit
    if (req.body.isHeroSlide !== undefined) {
      const parsedIsHeroSlide = req.body.isHeroSlide === 'true' || req.body.isHeroSlide === true;
      if (parsedIsHeroSlide && !item.isHeroSlide) {
        const heroSlideCount = await Product.countDocuments({ isHeroSlide: true });
        if (heroSlideCount >= 10) {
          return res.status(400).json({ success: false, message: 'لا يمكن إضافة أكثر من 10 عناصر للعرض الرئيسي' });
        }
      }
      req.body.isHeroSlide = parsedIsHeroSlide;
    }

    if (req.body.discountPercentage !== undefined) {
      req.body.discountPercentage = Number(req.body.discountPercentage) || 0;
    }

    // Handle sizes/dimensions
    let parsedHasSizes = req.body.hasSizes === 'true' || req.body.hasSizes === true;
    if (req.body.hasSizes !== undefined) {
      if (parsedHasSizes) {
        let parsedSizes = [];
        if (req.body.sizes) {
          try {
            parsedSizes = typeof req.body.sizes === 'string' ? JSON.parse(req.body.sizes) : req.body.sizes;
          } catch (e) {
            return res.status(400).json({ success: false, message: 'Invalid sizes format' });
          }
        }
        const validSizes = parsedSizes.filter(s => s.name && Number(s.price) > 0);
        if (validSizes.length === 0) {
          return res.status(400).json({ success: false, message: 'At least one valid size is required' });
        }
        req.body.sizes = validSizes;
        req.body.price = null;
      } else {
        req.body.sizes = [];
      }
      req.body.hasSizes = parsedHasSizes;
    }

    if (req.body.technicalDetails) {
      try {
        req.body.technicalDetails = typeof req.body.technicalDetails === 'string'
          ? JSON.parse(req.body.technicalDetails)
          : req.body.technicalDetails;
      } catch (e) {
        return res.status(400).json({ success: false, message: 'Invalid technical details format' });
      }
    }

    if (req.body.components !== undefined) {
      try {
        const arr = typeof req.body.components === 'string'
          ? JSON.parse(req.body.components)
          : req.body.components;
        if (Array.isArray(arr)) {
          let parsedComponents = [...new Set(arr.map(c => typeof c === 'string' ? c.trim() : '').filter(c => c.length > 0 && c.length <= 50))];
          if (parsedComponents.length > 20) parsedComponents = parsedComponents.slice(0, 20);
          req.body.components = parsedComponents;
        }
      } catch (e) {
        return res.status(400).json({ success: false, message: 'Invalid components format' });
      }
    }

    // Handle cover image replacement
    if (req.files && req.files.image && req.files.image[0]) {
      await destroyFromCloudinary(item.image?.publicId);
      const result = await uploadToCloudinary(req.files.image[0].buffer, 'nijar/items');
      req.body.image = result;
    } else if (req.file) {
      await destroyFromCloudinary(item.image?.publicId);
      const result = await uploadToCloudinary(req.file.buffer, 'nijar/items');
      req.body.image = result;
    } else if (req.body.image) {
      const newImg = typeof req.body.image === 'string' ? JSON.parse(req.body.image) : req.body.image;
      if (newImg.publicId && newImg.publicId !== item.image?.publicId) {
        // Different image, we can safely replace
        await destroyFromCloudinary(item.image?.publicId);
        req.body.image = newImg;
      }
    }

    // Handle gallery: append new images to existing gallery
    let newGalleryImages = [];
    if (req.files && req.files.gallery && req.files.gallery.length > 0) {
      newGalleryImages = await Promise.all(
        req.files.gallery.map(f => uploadToCloudinary(f.buffer, 'nijar/gallery'))
      );
    } else if (req.body.gallery) {
      const parsedGallery = typeof req.body.gallery === 'string' ? JSON.parse(req.body.gallery) : req.body.gallery;
      // We assume pre-uploaded gallery images sent in body are NEW images appended.
      // If they are not objects with publicId, we ignore.
      if (Array.isArray(parsedGallery)) {
        newGalleryImages = parsedGallery.filter(img => img.url && img.publicId);
      }
    }
    
    if (newGalleryImages.length > 0) {
      req.body.gallery = [...(item.gallery || []), ...newGalleryImages];
    } else {
      // Keep existing if no new images appended, removal handled below
      req.body.gallery = item.gallery || [];
    }

    // Handle gallery image removal (pass publicIds to delete)
    if (req.body.removeGalleryIds) {
      const idsToRemove = typeof req.body.removeGalleryIds === 'string'
        ? JSON.parse(req.body.removeGalleryIds)
        : req.body.removeGalleryIds;

      await Promise.all(idsToRemove.map(destroyFromCloudinary));

      const currentGallery = req.body.gallery || item.gallery || [];
      req.body.gallery = currentGallery.filter(img => !idsToRemove.includes(img.publicId));
    }

    Object.assign(item, req.body);
    const updated = await item.save();

    // Trigger bundle update if product is no longer available
    if (updated.isAvailable === false) {
      await Bundle.updateMany(
        { products: updated._id, isAvailable: true },
        { $set: { isAvailable: false } }
      );
    }

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'كود المنتج موجود بالفعل. يرجى إدخال كود فريد.' });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    next(error);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const item = await Product.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    // Delete cover image from Cloudinary
    await destroyFromCloudinary(item.image?.publicId);

    // Delete all gallery images from Cloudinary
    if (item.gallery && item.gallery.length > 0) {
      await Promise.all(item.gallery.map(img => destroyFromCloudinary(img.publicId)));
    }

    // Disable bundles containing this product
    await Bundle.updateMany(
      { products: item._id, isAvailable: true },
      { $set: { isAvailable: false } }
    );

    await item.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

exports.reorderProducts = async (req, res, next) => {
  try {
    const { orderedIds } = req.body;

    await Promise.all(
      orderedIds.map((id, index) =>
        Product.findByIdAndUpdate(id, { displayOrder: index + 1 })
      )
    );

    const items = await Product.find({ _id: { $in: orderedIds } }).sort({ displayOrder: 1 });
    res.status(200).json({ success: true, data: items });
  } catch (error) {
    next(error);
  }
};

exports.getBestSellers = async (req, res, next) => {
  try {
    const items = await Product.find({ isBestSeller: true })
      .populate('category', 'name');
    res.status(200).json({ success: true, count: items.length, data: items });
  } catch (error) {
    next(error);
  }
};

exports.getHeroSlides = async (req, res, next) => {
  try {
    const items = await Product.find({ isHeroSlide: true, isAvailable: true })
      .populate('category', 'name');
    res.status(200).json({ success: true, count: items.length, data: items });
  } catch (error) {
    next(error);
  }
};
