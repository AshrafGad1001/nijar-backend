const multer = require('multer');
const FileType = require('file-type');

// Use memory storage
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Basic header check, we will strictly verify using magic bytes later
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB max per image
  },
});

const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];

const checkMagicBytes = async (req, res, next) => {
  // Check cover image
  if (req.file) {
    try {
      const fileTypeResult = await FileType.fromBuffer(req.file.buffer);
      if (!fileTypeResult || !allowedMimeTypes.includes(fileTypeResult.mime)) {
        return res.status(400).json({ success: false, message: 'Invalid image format. Only JPEG, PNG, and WebP are allowed.' });
      }
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Error checking file format.' });
    }
  }

  // Check gallery images (array of files)
  if (req.files && req.files.gallery) {
    for (const file of req.files.gallery) {
      try {
        const fileTypeResult = await FileType.fromBuffer(file.buffer);
        if (!fileTypeResult || !allowedMimeTypes.includes(fileTypeResult.mime)) {
          return res.status(400).json({ success: false, message: 'Invalid gallery image format. Only JPEG, PNG, and WebP are allowed.' });
        }
      } catch (error) {
        return res.status(500).json({ success: false, message: 'Error checking gallery file format.' });
      }
    }
  }

  // Handle req.files.image for multi-part (cover image uploaded alongside gallery)
  if (req.files && req.files.image && req.files.image[0]) {
    try {
      const fileTypeResult = await FileType.fromBuffer(req.files.image[0].buffer);
      if (!fileTypeResult || !allowedMimeTypes.includes(fileTypeResult.mime)) {
        return res.status(400).json({ success: false, message: 'Invalid cover image format. Only JPEG, PNG, and WebP are allowed.' });
      }
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Error checking cover file format.' });
    }
  }

  next();
};

module.exports = { upload, checkMagicBytes };
