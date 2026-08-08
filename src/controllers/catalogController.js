const Category = require('../models/Category');
const Product = require('../models/Product');

exports.getFullMenu = async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ displayOrder: 1 });
    
    const menuData = await Promise.all(
      categories.map(async (cat) => {
        const items = await Product.find({ category: cat._id, isAvailable: true }).sort({ displayOrder: 1 });
        return {
          _id: cat._id,
          name: cat.name,
          image: cat.image,
          displayOrder: cat.displayOrder,
          items: items
        };
      })
    );
    
    res.status(200).json({ success: true, data: menuData });
  } catch (error) {
    next(error);
  }
};

const mongoose = require('mongoose');

exports.getProductBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    let item;
    
    if (mongoose.Types.ObjectId.isValid(slug)) {
      item = await Product.findById(slug).populate('category', 'name');
    }
    
    if (!item) {
      item = await Product.findOne({ slug }).populate('category', 'name');
    }

    if (!item || !item.isAvailable) {
      return res.status(404).json({ success: false, message: 'المنتج غير موجود' });
    }

    res.status(200).json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};
