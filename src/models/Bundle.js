const mongoose = require('mongoose');
const slugify = require('slugify');

const bundleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  products: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    }],
    validate: [
      {
        validator: function (val) {
          return val && val.length >= 2;
        },
        message: 'يجب أن يحتوي الباكدج على منتجين على الأقل',
      }
    ],
    required: true,
  },
  discountPercentage: {
    type: Number,
    required: true,
    min: [0, 'لا يمكن أن تكون نسبة الخصم بالسالب'],
    max: [99, 'لا يمكن أن تتجاوز نسبة الخصم 99%'],
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  displayOrder: {
    type: Number,
    required: true,
    default: 0,
  },
  slug: {
    type: String,
    unique: true,
    sparse: true,
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

bundleSchema.pre('save', function (next) {
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

const Bundle = mongoose.model('Bundle', bundleSchema);

module.exports = Bundle;
