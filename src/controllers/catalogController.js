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
