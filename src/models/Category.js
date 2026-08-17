const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
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
  displayOrder: {
    type: Number,
    required: true,
    default: 0,
  },
  isStandalonePiece: {
    type: Boolean,
    default: false,
  },
  hidePrices: {
    type: Boolean,
    default: false,
  },
  slug: {
    type: String,
    unique: true,
    sparse: true,
  },
}, {
  timestamps: true,
});

categorySchema.index({ displayOrder: 1 });

const slugify = require('slugify');

categorySchema.pre('save', function (next) {
  if (this.isModified('name') || !this.slug) {
    const baseSlug = slugify(this.name, {
      lower: true,
      strict: true,
      trim: true
    });
    this.slug = `${baseSlug}-${this._id.toString().slice(-5)}`;
  }
  next();
});

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
