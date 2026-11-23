import express, { Request, Response, NextFunction } from 'express';
import { 
  getSettings, 
  updateSettings, 
  updateNavbarLogo, 
  updateFooterLogo, 
  resetNavbarLogo, 
  resetFooterLogo, 
  updateLogoDimensions 
} from '../controllers/settingsController';
import { authenticate, authorize } from '../middleware/auth';
import { uploadLogoImage } from '../middleware/upload';

const router = express.Router();

// Multer error handler middleware to deliver user-friendly JSON on size/type violations
const handleLogoUpload = (req: Request, res: Response, next: NextFunction) => {
  uploadLogoImage.single('logo')(req, res, (err: any) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ 
          success: false, 
          message: 'File size too large. Maximum allowed size is 5 MB.' 
        });
      }
      return res.status(400).json({ 
        success: false, 
        message: err.message || 'File upload error. Only PNG, JPG, JPEG, WEBP, and SVG formats are supported.' 
      });
    }
    next();
  });
};

// Public read access for website visitors
router.get('/', getSettings);

// SuperAdmin-only branding & logo management
router.put('/branding/navbar-logo', authenticate, authorize(['superadmin']), handleLogoUpload, updateNavbarLogo);
router.put('/branding/footer-logo', authenticate, authorize(['superadmin']), handleLogoUpload, updateFooterLogo);
router.post('/branding/navbar-logo/reset', authenticate, authorize(['superadmin']), resetNavbarLogo);
router.post('/branding/footer-logo/reset', authenticate, authorize(['superadmin']), resetFooterLogo);
router.put('/branding/dimensions', authenticate, authorize(['superadmin']), updateLogoDimensions);

// General website settings
router.put('/', authenticate, authorize(['superadmin']), handleLogoUpload, updateSettings);

export default router;
