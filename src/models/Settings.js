const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  adminName: {
    type: String,
    required: [true, 'يرجى إدخال اسم الأدمن'],
    trim: true,
  },
  adminImage: {
    url: { type: String, default: '' },
    publicId: { type: String, default: '' },
  },
  address: {
    type: String,
    required: [true, 'يرجى إدخال العنوان'],
    trim: true,
  },
  phone: {
    type: String,
    required: [true, 'يرجى إدخال رقم الهاتف'],
    trim: true,
    minlength: [10, 'رقم الهاتف قصير جداً'],
    maxlength: [20, 'رقم الهاتف طويل جداً']
  },
  whatsapp: {
    type: String,
    required: [true, 'يرجى إدخال رقم الواتساب'],
    trim: true,
    minlength: [10, 'رقم الواتساب قصير جداً'],
    maxlength: [20, 'رقم الواتساب طويل جداً']
  },
  mapUrl: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true,
});

const Settings = mongoose.model('Settings', settingsSchema);

module.exports = Settings;
