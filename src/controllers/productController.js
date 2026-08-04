const Product = require('../models/Product');
const Category = require('../models/Category');
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

exports.createProduct = async (req, res, next) => {
  try {
    const { name, description, price, category, isAvailable } = req.body;

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

    const itemData = {
      name,
      description,
      price: parsedHasSizes ? null : price,
      category,
      isAvailable,
      isBestSeller: parsedIsBestSeller,
      isHeroSlide: parsedIsHeroSlide,
      hasSizes: parsedHasSizes,
      sizes: parsedSizes,
      displayOrder: count + 1,
      gallery: [],
    };

    // Handle cover image upload
    if (req.files && req.files.image && req.files.image[0]) {
      const result = await uploadToCloudinary(req.files.image[0].buffer, 'nijar/items');
      itemData.image = result;
    } else if (req.file) {
      // fallback for single upload
      const result = await uploadToCloudinary(req.file.buffer, 'nijar/items');
      itemData.image = result;
    }

    // Handle gallery images upload
    if (req.files && req.files.gallery && req.files.gallery.length > 0) {
      const galleryUploads = await Promise.all(
        req.files.gallery.map(f => uploadToCloudinary(f.buffer, 'nijar/gallery'))
      );
      itemData.gallery = galleryUploads;
    }

    const item = await Product.create(itemData);
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
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

    // Handle cover image replacement
    if (req.files && req.files.image && req.files.image[0]) {
      await destroyFromCloudinary(item.image?.publicId);
      const result = await uploadToCloudinary(req.files.image[0].buffer, 'nijar/items');
      req.body.image = result;
    } else if (req.file) {
      await destroyFromCloudinary(item.image?.publicId);
      const result = await uploadToCloudinary(req.file.buffer, 'nijar/items');
      req.body.image = result;
    }

    // Handle gallery: append new images to existing gallery
    if (req.files && req.files.gallery && req.files.gallery.length > 0) {
      const newGalleryImages = await Promise.all(
        req.files.gallery.map(f => uploadToCloudinary(f.buffer, 'nijar/gallery'))
      );
      req.body.gallery = [...(item.gallery || []), ...newGalleryImages];
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

    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
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
