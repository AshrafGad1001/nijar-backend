const Category = require('../models/Category');
const MenuItem = require('../models/MenuItem');
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

exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ displayOrder: 1 });
    res.status(200).json({ success: true, count: categories.length, data: categories });
  } catch (error) {
    next(error);
  }
};

exports.createCategory = async (req, res, next) => {
  try {
    const { name } = req.body;
    const count = await Category.countDocuments();

    const categoryData = { name, displayOrder: count + 1 };

    // Handle image upload if a file is provided
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, 'nijar/categories');
      categoryData.image = result;
    }

    const category = await Category.create(categoryData);
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

exports.updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    // Handle new image upload
    if (req.file) {
      // Delete old image from Cloudinary if it exists
      if (category.image && category.image.publicId) {
        await cloudinary.uploader.destroy(category.image.publicId);
      }
      const result = await uploadToCloudinary(req.file.buffer, 'nijar/categories');
      req.body.image = result;
    }

    const updated = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    // Delete category image from Cloudinary
    if (category.image && category.image.publicId) {
      await cloudinary.uploader.destroy(category.image.publicId);
    }

    // Delete all menu items in this category (and their images)
    const items = await MenuItem.find({ category: req.params.id });
    for (const item of items) {
      if (item.image && item.image.publicId) {
        await cloudinary.uploader.destroy(item.image.publicId);
      }
    }
    await MenuItem.deleteMany({ category: req.params.id });

    await category.deleteOne();

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

exports.reorderCategories = async (req, res, next) => {
  try {
    const { orderedIds } = req.body;

    await Promise.all(
      orderedIds.map((id, index) =>
        Category.findByIdAndUpdate(id, { displayOrder: index + 1 })
      )
    );

    const categories = await Category.find().sort({ displayOrder: 1 });
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};
