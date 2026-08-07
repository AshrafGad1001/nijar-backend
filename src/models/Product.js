// Tested write access by Antigravity AI
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  price: {
    type: Number,
    required: false,
    default: null,
  },
  hasSizes: {
    type: Boolean,
    default: false,
  },
  sizes: [{
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
    },
    variantDetails: {
      woodType: { type: String, default: '', trim: true },
      paintType: { type: String, default: '', trim: true },
      hardware: { type: String, default: '', trim: true },
      material: { type: String, default: '', trim: true },
      dimensions: { type: String, default: '', trim: true },
    }
  }],
  technicalDetails: {
    woodType: { type: String, default: '', trim: true },
    paintType: { type: String, default: '', trim: true },
    warranty: { type: String, default: '', trim: true },
    dimensions: { type: String, default: '', trim: true },
    productionTime: { type: String, default: '', trim: true },
  },
  image: {
    url: {
      type: String,
      default: '',
    },
    publicId: {
      type: String,
      default: '',
    },
  },
  // Gallery: multiple additional images per piece
  gallery: [{
    url: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      required: true,
    },
  }],
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  isBestSeller: {
    type: Boolean,
    default: false,
  },
  isHeroSlide: {
    type: Boolean,
    default: false,
  },
  displayOrder: {
    type: Number,
    required: true,
    default: 0,
  },
  slug: {
    type: String,
    unique: true,
    sparse: true, // For existing docs that might not have it yet
  },
}, {
  timestamps: true,
});

productSchema.index({ category: 1, displayOrder: 1 });
productSchema.index({ isHeroSlide: 1 });
productSchema.index({ isBestSeller: 1 });
productSchema.index({ slug: 1 });

const slugify = require('slugify');

productSchema.pre('save', function (next) {
  if (this.isModified('name') || !this.slug) {
    const baseSlug = slugify(this.name, {
      lower: true,
      strict: true, // strip special characters
      trim: true
    });
    // Append the last 5 chars of the ObjectId to ensure uniqueness always
    this.slug = `${baseSlug}-${this._id.toString().slice(-5)}`;
  }
  next();
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
