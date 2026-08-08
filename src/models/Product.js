// Tested write access by Antigravity AI
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  productCode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
    match: [/^[A-Z0-9\-]{3,15}$/, 'يجب أن يحتوي الكود على حروف وأرقام إنجليزية وعلامة ( - ) فقط، وبطول من 3 إلى 15 حرف'],
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  components: {
    type: [{
      type: String,
      trim: true,
      maxlength: [50, 'طول المكون لا يجب أن يتجاوز 50 حرف'],
    }],
    validate: [
      {
        validator: function (val) {
          return val.length <= 20;
        },
        message: 'لا يمكن إضافة أكثر من 20 مكون',
      }
    ],
    default: []
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
      mechanism: { type: String, default: '', trim: true },
      handles: { type: String, default: '', trim: true },
      hinges: { type: String, default: '', trim: true },
      warranty: { type: String, default: '', trim: true },
      productionTime: { type: String, default: '', trim: true },
      dimensions: {
        length: { type: Number, default: null, min: 0 },
        width: { type: Number, default: null, min: 0 },
        height: { type: Number, default: null, min: 0 },
      },
    }
  }],
  technicalDetails: {
    woodType: { type: String, default: '', trim: true },
    paintType: { type: String, default: '', trim: true },
    mechanism: { type: String, default: '', trim: true },
    handles: { type: String, default: '', trim: true },
    hinges: { type: String, default: '', trim: true },
    warranty: { type: String, default: '', trim: true },
    productionTime: { type: String, default: '', trim: true },
    dimensions: {
      length: { type: Number, default: null, min: 0 },
      width: { type: Number, default: null, min: 0 },
      height: { type: Number, default: null, min: 0 },
    },
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
