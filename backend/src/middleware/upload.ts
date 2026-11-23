import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary';

const batchStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'EasyTalk/batches',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  } as any,
});

const courseStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'EasyTalk/courses',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  } as any,
});

const galleryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'EasyTalk/gallery',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  } as any,
});

const blogStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'EasyTalk/blog',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  } as any,
});

export const uploadBatchImage = multer({
  storage: batchStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

export const uploadCourseImage = multer({
  storage: courseStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

export const uploadGalleryImage = multer({
  storage: galleryStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

export const uploadBlogImage = multer({
  storage: blogStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

const testimonialStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'EasyTalk/testimonials',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  } as any,
});
export const uploadTestimonialImage = multer({
  storage: testimonialStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const logoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'EasyTalk/logo',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'svg'],
  } as any,
});
export const uploadLogoImage = multer({
  storage: logoStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
    if (allowed.includes(file.mimetype.toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file format. Supported formats: PNG, JPG, JPEG, WEBP, SVG (Max 5MB).'));
    }
  }
});

const userStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'EasyTalk/users',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  } as any,
});

export const uploadUserImage = multer({
  storage: userStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
});
