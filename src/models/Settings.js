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
  },
  aboutUsText: {
    type: String,
    trim: true,
    maxlength: [600, 'النص طويل جداً، الحد الأقصى 600 حرف'],
    default: 'نحن في Nijar نجمع بين الأصالة والحداثة لنقدم لك أرقى المشغولات الخشبية. منذ تأسيسنا ونحن نصنع قطعاً فنية تعكس شغفنا من الخشب والجمال في تفاصيله. سواء كانت قطع أثاث رئيسية أو ديكورات خشبية دقيقة، نستخدم أفضل أنواع الأخشاب لضمان متانة وجودة تعيش معك طويلاً.'
  },
  facebookUrl: {
    type: String,
    trim: true,
    default: '',
    match: [/^https?:\/\/.+/, 'يرجى إدخال رابط صحيح يبدأ بـ http:// أو https://']
  },
  instagramUrl: {
    type: String,
    trim: true,
    default: '',
    match: [/^https?:\/\/.+/, 'يرجى إدخال رابط صحيح يبدأ بـ http:// أو https://']
  },
  tiktokUrl: {
    type: String,
    trim: true,
    default: '',
    match: [/^https?:\/\/.+/, 'يرجى إدخال رابط صحيح يبدأ بـ http:// أو https://']
  }
}, {
  timestamps: true,
});

const Settings = mongoose.model('Settings', settingsSchema);

module.exports = Settings;
