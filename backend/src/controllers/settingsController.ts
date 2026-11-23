import { deleteCloudinaryAsset } from '../utils/deleteCloudinaryAsset';
import { Request, Response } from 'express';
import { Settings } from '../models/Settings';
import mongoose from 'mongoose';

const DEFAULT_NAVBAR_LOGO = '/assets/logo/easy-talk-brand-logo.png';
const DEFAULT_FOOTER_LOGO = '/assets/logo/easy-talk-brand-logo.png';

/**
 * Helper to ensure a settings object has complete branding structures
 */
const ensureBranding = (settingsDoc: any) => {
  if (!settingsDoc) return settingsDoc;
  if (!settingsDoc.branding) {
    settingsDoc.branding = {};
  }
  if (!settingsDoc.branding.navbarLogo) {
    settingsDoc.branding.navbarLogo = {
      url: settingsDoc.logoUrl || DEFAULT_NAVBAR_LOGO,
      publicId: settingsDoc.logoPublicId || '',
      width: 210,
      height: 48,
      mobileWidth: 160,
      mobileHeight: 40,
      updatedAt: new Date(),
    };
  }
  if (!settingsDoc.branding.footerLogo) {
    settingsDoc.branding.footerLogo = {
      url: settingsDoc.logoUrl || DEFAULT_FOOTER_LOGO,
      publicId: '',
      width: 180,
      height: 40,
      mobileWidth: 140,
      mobileHeight: 36,
      updatedAt: new Date(),
    };
  }
  return settingsDoc;
};

export const getSettings = async (req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState !== 1) { 
      return res.json({
        instituteName: 'Easy Talk Institute',
        tagline: 'अंग्रेजी बोलना सीखें, बिल्कुल Basic से Advanced तक',
        address: 'प्राचीन देवी मंदिर के ठीक बगल में, 2nd Floor, PG Road, Jehanabad, Bihar',
        phone: '+91 9431885389',
        email: 'siyaramkumar103@gmail.com',
        whatsapp: '+919431885389',
        logoUrl: DEFAULT_NAVBAR_LOGO,
        branding: {
          navbarLogo: {
            url: DEFAULT_NAVBAR_LOGO,
            publicId: '',
            width: 210,
            height: 48,
            mobileWidth: 160,
            mobileHeight: 40,
            updatedAt: new Date(),
          },
          footerLogo: {
            url: DEFAULT_FOOTER_LOGO,
            publicId: '',
            width: 180,
            height: 40,
            mobileWidth: 140,
            mobileHeight: 36,
            updatedAt: new Date(),
          }
        },
        faviconUrl: '/vite.svg',
        footerText: 'Transforming careers through effective communication.',
        facebookUrl: '#',
        instagramUrl: '#',
        twitterUrl: '#',
        youtubeUrl: '#',
        googleMapUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14392.348636450654!2d84.97864459999999!3d25.148142!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39f2d7bf83cdb00b%3A0xb35fa324080eb2df!2sJehanabad%2C%20Bihar!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin',
        metaTitle: 'Easy Talk Institute',
        metaDescription: 'Learn Spoken English in Jehanabad.'
      });
    }
    
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    } else if (!settings.branding || !settings.branding.navbarLogo || !settings.branding.footerLogo) {
      ensureBranding(settings);
      await settings.save();
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching settings' });
  }
};

export const updateSettings = async (req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState !== 1) { return res.json(req.body); }
    
    let settings = await Settings.findOne();
    
    if (req.file) {
      if (settings && settings.logoPublicId) {
        await deleteCloudinaryAsset(settings.logoPublicId);
      }
      req.body.logoUrl = req.file.path;
      req.body.logoPublicId = req.file.filename;
    }

    if (!settings) {
      settings = new Settings(req.body);
      ensureBranding(settings);
      await settings.save();
    } else {
      settings = await Settings.findOneAndUpdate({}, req.body, { new: true });
      if (settings) ensureBranding(settings);
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating settings' });
  }
};

/**
 * SuperAdmin: Upload / Replace Navbar Logo independently
 */
export const updateNavbarLogo = async (req: Request, res: Response) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings({});
    }
    ensureBranding(settings);

    let newUrl = req.file?.path || req.body.url;
    let newPublicId = req.file?.filename || req.body.publicId || '';

    if (!newUrl) {
      return res.status(400).json({ success: false, message: 'No logo image file or URL provided.' });
    }

    // Delete previous Cloudinary asset if replacing
    const oldPublicId = settings.branding?.navbarLogo?.publicId;
    if (oldPublicId && oldPublicId !== newPublicId) {
      await deleteCloudinaryAsset(oldPublicId);
    }

    const width = Number(req.body.width) || settings.branding?.navbarLogo?.width || 210;
    const height = Number(req.body.height) || settings.branding?.navbarLogo?.height || 48;
    const mobileWidth = Number(req.body.mobileWidth) || settings.branding?.navbarLogo?.mobileWidth || 160;
    const mobileHeight = Number(req.body.mobileHeight) || settings.branding?.navbarLogo?.mobileHeight || 40;

    settings.branding.navbarLogo = {
      url: newUrl,
      publicId: newPublicId,
      width,
      height,
      mobileWidth,
      mobileHeight,
      updatedAt: new Date()
    };

    // Keep legacy logoUrl in sync
    settings.logoUrl = newUrl;
    settings.logoPublicId = newPublicId;

    await settings.save();

    res.json({
      success: true,
      message: 'Navbar logo updated successfully',
      settings
    });
  } catch (error: any) {
    console.error('Error updating navbar logo:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to update navbar logo' });
  }
};

/**
 * SuperAdmin: Upload / Replace Footer Logo independently
 */
export const updateFooterLogo = async (req: Request, res: Response) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings({});
    }
    ensureBranding(settings);

    let newUrl = req.file?.path || req.body.url;
    let newPublicId = req.file?.filename || req.body.publicId || '';

    if (!newUrl) {
      return res.status(400).json({ success: false, message: 'No logo image file or URL provided.' });
    }

    // Delete previous Cloudinary asset if replacing
    const oldPublicId = settings.branding?.footerLogo?.publicId;
    if (oldPublicId && oldPublicId !== newPublicId) {
      await deleteCloudinaryAsset(oldPublicId);
    }

    const width = Number(req.body.width) || settings.branding?.footerLogo?.width || 180;
    const height = Number(req.body.height) || settings.branding?.footerLogo?.height || 40;
    const mobileWidth = Number(req.body.mobileWidth) || settings.branding?.footerLogo?.mobileWidth || 140;
    const mobileHeight = Number(req.body.mobileHeight) || settings.branding?.footerLogo?.mobileHeight || 36;

    // Notice: Navbar logo is UNTOUCHED
    settings.branding.footerLogo = {
      url: newUrl,
      publicId: newPublicId,
      width,
      height,
      mobileWidth,
      mobileHeight,
      updatedAt: new Date()
    };

    await settings.save();

    res.json({
      success: true,
      message: 'Footer logo updated successfully',
      settings
    });
  } catch (error: any) {
    console.error('Error updating footer logo:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to update footer logo' });
  }
};

/**
 * SuperAdmin: Reset Navbar Logo to institute default
 */
export const resetNavbarLogo = async (req: Request, res: Response) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings({});
    }
    ensureBranding(settings);

    const oldPublicId = settings.branding?.navbarLogo?.publicId;
    if (oldPublicId) {
      await deleteCloudinaryAsset(oldPublicId);
    }

    settings.branding.navbarLogo = {
      url: DEFAULT_NAVBAR_LOGO,
      publicId: '',
      width: 210,
      height: 48,
      mobileWidth: 160,
      mobileHeight: 40,
      updatedAt: new Date()
    };

    settings.logoUrl = DEFAULT_NAVBAR_LOGO;
    settings.logoPublicId = '';

    await settings.save();

    res.json({
      success: true,
      message: 'Navbar logo reset to default successfully',
      settings
    });
  } catch (error: any) {
    console.error('Error resetting navbar logo:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to reset navbar logo' });
  }
};

/**
 * SuperAdmin: Reset Footer Logo to institute default
 */
export const resetFooterLogo = async (req: Request, res: Response) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings({});
    }
    ensureBranding(settings);

    const oldPublicId = settings.branding?.footerLogo?.publicId;
    if (oldPublicId) {
      await deleteCloudinaryAsset(oldPublicId);
    }

    // Notice: Navbar logo remains intact!
    settings.branding.footerLogo = {
      url: DEFAULT_FOOTER_LOGO,
      publicId: '',
      width: 180,
      height: 40,
      mobileWidth: 140,
      mobileHeight: 36,
      updatedAt: new Date()
    };

    await settings.save();

    res.json({
      success: true,
      message: 'Footer logo reset to default successfully',
      settings
    });
  } catch (error: any) {
    console.error('Error resetting footer logo:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to reset footer logo' });
  }
};

/**
 * SuperAdmin: Update logo dimensions without re-uploading image
 */
export const updateLogoDimensions = async (req: Request, res: Response) => {
  try {
    const { target, width, height, mobileWidth, mobileHeight } = req.body;
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings({});
    }
    ensureBranding(settings);

    if (target === 'navbar' || target === 'both') {
      if (width) settings.branding.navbarLogo.width = Number(width);
      if (height) settings.branding.navbarLogo.height = Number(height);
      if (mobileWidth) settings.branding.navbarLogo.mobileWidth = Number(mobileWidth);
      if (mobileHeight) settings.branding.navbarLogo.mobileHeight = Number(mobileHeight);
      settings.branding.navbarLogo.updatedAt = new Date();
    }

    if (target === 'footer' || target === 'both') {
      if (width) settings.branding.footerLogo.width = Number(width);
      if (height) settings.branding.footerLogo.height = Number(height);
      if (mobileWidth) settings.branding.footerLogo.mobileWidth = Number(mobileWidth);
      if (mobileHeight) settings.branding.footerLogo.mobileHeight = Number(mobileHeight);
      settings.branding.footerLogo.updatedAt = new Date();
    }

    await settings.save();

    res.json({
      success: true,
      message: 'Logo dimensions updated successfully',
      settings
    });
  } catch (error: any) {
    console.error('Error updating logo dimensions:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to update logo dimensions' });
  }
};