const Settings = require('../models/Settings');
const cloudinary = require('../config/cloudinary');
const { triggerFrontendRevalidate } = require('../utils/revalidate');

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

const defaultSettings = {
  adminName: 'إدارة النظام',
  adminImage: { url: '', publicId: '' },
  address: 'القاهرة، مصر (العنوان التفصيلي قريباً)',
  phone: '+20 000 000 0000',
  whatsapp: '+20 000 000 0000',
  mapUrl: '',
  facebookUrl: '',
  instagramUrl: '',
  tiktokUrl: ''
};

exports.getSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne({});
    
    // Fallback if no settings exist in the database
    if (!settings) {
      settings = defaultSettings;
    }

    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};

exports.updateSettings = async (req, res, next) => {
  try {
    const { adminName, address, phone, whatsapp, mapUrl, aboutUsText, facebookUrl, instagramUrl, tiktokUrl } = req.body;
    
    // Fetch the existing settings to get the old image publicId if we need to delete it
    let settings = await Settings.findOne({});
    let imageObj = settings ? settings.adminImage : { url: '', publicId: '' };

    // Handle image upload if a new file is provided
    if (req.file) {
      // Delete old image if it exists
      if (imageObj && imageObj.publicId) {
        await destroyFromCloudinary(imageObj.publicId);
      }
      // Upload new image
      imageObj = await uploadToCloudinary(req.file.buffer, 'nijar/settings');
    }

    const dataToUpdate = {
      adminName,
      address,
      phone,
      whatsapp,
      mapUrl,
      facebookUrl,
      instagramUrl,
      tiktokUrl,
      adminImage: imageObj
    };
    
    if (aboutUsText !== undefined) {
      dataToUpdate.aboutUsText = aboutUsText;
    }

    // Singleton Update: Upsert true ensures only ONE document exists
    const updatedSettings = await Settings.findOneAndUpdate(
      {}, // empty filter matches the first document
      dataToUpdate,
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true
      }
    );

    triggerFrontendRevalidate('settings');
    triggerFrontendRevalidate('catalog'); // Revalidate catalog since settings include footer/navbar

    res.status(200).json({ success: true, data: updatedSettings });
  } catch (error) {
    next(error);
  }
};
